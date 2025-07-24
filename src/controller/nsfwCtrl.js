const tf = require('@tensorflow/tfjs-node')
const nsfw = require('nsfwjs')

let model
const loadModel = async () => {
  if (!model) model = await nsfw.load()
  return model
}

const checkImageNSFW = async (req, res) => {
  try {
    if (!req.file) return res.status(400).send('No file uploaded.')

    const allowedTypes = ['image/jpeg', 'image/png', 'image/bmp', 'image/gif']
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).send('Only JPEG, PNG, BMP, or GIF images are supported.')
    }

    const imageBuffer = req.file.buffer
    const imageTensor = tf.node.decodeImage(imageBuffer, 3)

    const model = await loadModel()
    const predictions = await model.classify(imageTensor)
    imageTensor.dispose()

    const top = predictions.sort((a, b) => b.probability - a.probability)[0]
    const resultText = `${top.className} (${(top.probability * 100).toFixed(2)}%)`

    res.redirect('/nsfw?result=' + encodeURIComponent(resultText))
  } catch (err) {
    console.error('Error during NSFW classification:', err)
    res.status(500).send('Internal Server Error')
  }
}

module.exports = { checkImageNSFW }
