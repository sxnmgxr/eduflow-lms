const ffmpeg = require('fluent-ffmpeg')
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg')
const {
  GetObjectCommand,
  PutObjectCommand,
  HeadObjectCommand,
} = require('@aws-sdk/client-s3')
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')
const s3 = require('../config/s3')
const fs = require('fs')
const path = require('path')
const os = require('os')

ffmpeg.setFfmpegPath(ffmpegInstaller.path)

const BUCKET = process.env.AWS_BUCKET_NAME

/**
 * Download file from S3 to local temp dir
 */
const downloadFromS3 = async (key, localPath) => {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key })
  const response = await s3.send(command)

  return new Promise((resolve, reject) => {
    const writeStream = fs.createWriteStream(localPath)
    response.Body.pipe(writeStream)
    writeStream.on('finish', resolve)
    writeStream.on('error', reject)
  })
}

/**
 * Upload a file to S3
 */
const uploadToS3 = async (localPath, s3Key, contentType = 'application/octet-stream') => {
  const fileBuffer = fs.readFileSync(localPath)
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: s3Key,
    Body: fileBuffer,
    ContentType: contentType,
  }))
}

/**
 * Upload entire HLS folder to S3
 */
const uploadHLSFolder = async (localDir, s3Prefix) => {
  const files = fs.readdirSync(localDir)
  const uploads = files.map(async (file) => {
    const localPath = path.join(localDir, file)
    const s3Key = `${s3Prefix}/${file}`
    const contentType = file.endsWith('.m3u8')
      ? 'application/x-mpegURL'
      : 'video/MP2T'
    await uploadToS3(localPath, s3Key, contentType)
    return s3Key
  })
  await Promise.all(uploads)
  return `${s3Prefix}/master.m3u8`
}

/**
 * Get video duration using ffprobe
 */
const getVideoDuration = (inputPath) => new Promise((resolve, reject) => {
  ffmpeg.ffprobe(inputPath, (err, metadata) => {
    if (err) reject(err)
    else resolve(Math.round(metadata.format.duration || 0))
  })
})

/**
 * Transcode video to multi-quality HLS
 * Produces: 360p, 720p, 1080p + master playlist
 */
const transcodeToHLS = (inputPath, outputDir) => new Promise((resolve, reject) => {
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })

  const qualities = [
    { resolution: '640x360',  bitrate: '800k',  name: '360p'  },
    { resolution: '1280x720', bitrate: '2500k', name: '720p'  },
    { resolution: '1920x1080',bitrate: '5000k', name: '1080p' },
  ]

  // Build master playlist manually
  let masterPlaylist = '#EXTM3U\n#EXT-X-VERSION:3\n\n'

  const transcodeQueue = qualities.map(({ resolution, bitrate, name }) =>
    new Promise((res, rej) => {
      const qualityDir = path.join(outputDir, name)
      if (!fs.existsSync(qualityDir)) fs.mkdirSync(qualityDir, { recursive: true })

      const [width, height] = resolution.split('x').map(Number)
      const bandwidth = parseInt(bitrate) * 1000

      masterPlaylist += `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${resolution}\n${name}/index.m3u8\n\n`

      ffmpeg(inputPath)
        .outputOptions([
          '-c:v libx264',
          '-crf 23',
          '-preset fast',
          `-vf scale=${width}:${height}`,
          `-b:v ${bitrate}`,
          '-c:a aac',
          '-b:a 128k',
          '-hls_time 6',
          '-hls_playlist_type vod',
          '-hls_segment_filename', path.join(qualityDir, 'segment%03d.ts'),
        ])
        .output(path.join(qualityDir, 'index.m3u8'))
        .on('end', () => res())
        .on('error', (err) => rej(err))
        .run()
    })
  )

  Promise.all(transcodeQueue)
    .then(() => {
      // Write master playlist
      fs.writeFileSync(path.join(outputDir, 'master.m3u8'), masterPlaylist)
      resolve()
    })
    .catch(reject)
})

/**
 * Full pipeline: download → transcode → upload → cleanup
 */
const processVideo = async (job) => {
  const { lessonId, videoKey, courseId } = job.data
  const tmpDir = path.join(os.tmpdir(), `eduflow-${lessonId}`)
  const inputPath = path.join(tmpDir, 'input' + path.extname(videoKey))
  const outputDir = path.join(tmpDir, 'hls')

  try {
    console.log(`[Transcoder] Starting job for lesson ${lessonId}`)
    fs.mkdirSync(tmpDir, { recursive: true })

    // 1. Download raw video from S3
    console.log(`[Transcoder] Downloading from S3: ${videoKey}`)
    job.progress(10)
    await downloadFromS3(videoKey, inputPath)

    // 2. Get duration
    const duration = await getVideoDuration(inputPath)
    console.log(`[Transcoder] Duration: ${duration}s`)
    job.progress(20)

    // 3. Transcode to HLS
    console.log(`[Transcoder] Transcoding to HLS...`)
    await transcodeToHLS(inputPath, outputDir)
    job.progress(70)

    // 4. Upload HLS to S3
    console.log(`[Transcoder] Uploading HLS to S3...`)
    const s3Prefix = `hls-videos/${lessonId}`
    const hlsKey = await uploadHLSFolder(outputDir, s3Prefix)
    job.progress(90)

    // 5. Mark lesson as processed via internal API call
    const axios = require('axios')
    await axios.patch(
      `http://localhost:${process.env.PORT || 8000}/api/lessons/${lessonId}/processed`,
      { hls_key: hlsKey, duration_seconds: duration },
      { headers: { 'x-worker-secret': process.env.WORKER_SECRET || 'worker_secret_123' } }
    )

    job.progress(100)
    console.log(`[Transcoder] ✅ Lesson ${lessonId} processed successfully`)

    return { hlsKey, duration }
  } finally {
    // Cleanup temp files
    fs.rmSync(tmpDir, { recursive: true, force: true })
    console.log(`[Transcoder] Cleaned up temp files`)
  }
}

module.exports = { processVideo }