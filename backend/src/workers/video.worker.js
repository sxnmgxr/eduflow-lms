const { videoQueue } = require('../config/queue')
const { processVideo } = require('../services/transcode.service')

console.log('🎬 Video transcoding worker started')

videoQueue.process(2, async (job) => {
  try {
    return await processVideo(job)
  } catch (err) {
    console.error(`[Worker] Job ${job.id} failed:`, err.message)
    throw err
  }
})

videoQueue.on('completed', (job, result) => {
  console.log(`✅ Job ${job.id} completed:`, result)
})

videoQueue.on('failed', (job, err) => {
  console.error(`❌ Job ${job.id} failed after ${job.attemptsMade} attempts:`, err.message)
})

videoQueue.on('progress', (job, progress) => {
  console.log(`⏳ Job ${job.id} progress: ${progress}%`)
})