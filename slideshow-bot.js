const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const axios = require('axios');
const { promisify } = require('util');
const { pipeline } = require('stream');

const imagePaths = ['image1.jpg', 'image2.jpg', 'image3.jpg']; 
const textToRead = 'This is the text you want to read out loud.';


const videoOutputPath = 'output.mp4';


async function createVideoFromImages(imagePaths, outputVideoPath) {
  const writeFileAsync = promisify(fs.writeFile);

  
  const ttsAudioPath = 'tts.mp3';
  const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(textToRead)}&tl=en&client=tw-ob`;
  const response = await axios({
    method: 'get',
    url: ttsUrl,
    responseType: 'stream',
  });

  await new Promise((resolve, reject) => {
    const writeStream = fs.createWriteStream(ttsAudioPath);
    pipeline(response.data, writeStream, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });

  
  const ffmpegCommand = ffmpeg();

  
  imagePaths.forEach((imagePath) => {
    ffmpegCommand.input(imagePath);
  });

  
  ffmpegCommand.fps(1);

  
  ffmpegCommand.input(ttsAudioPath);
  ffmpegCommand.audioCodec('aac');
  ffmpegCommand.audioBitrate('128k');
  ffmpegCommand.audioChannels(2);
  ffmpegCommand.audioFrequency(44100);

  ffmpegCommand.output(outputVideoPath).on('end', () => {
    console.log('Video with TTS generated successfully:', outputVideoPath);
    fs.unlinkSync(ttsAudioPath);
  }).run();
}

createVideoFromImages(imagePaths, videoOutputPath);
