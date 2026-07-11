const Bull = require('bull')

const videoQueue = new Bull('video-transcoding', {
  redis: process.env.REDIS_URL,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: 10,
    removeOnFail: 20,
  },
})

videoQueue.on('error', (err) => {
  console.error('Queue error:', err)
})

videoQueue.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed:`, err.message)
})

module.exports = { videoQueue }