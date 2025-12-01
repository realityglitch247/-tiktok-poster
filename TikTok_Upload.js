
const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');


const folder = __dirname;
const files = fs.readdirSync(folder);
const videoFile = files.find(f => f.toLowerCase() === 'demo_video.mp4');

if (!videoFile) {
  console.error('ERROR: demo_video.mp4 not found in this folder!');
  console.log('Files found:', files);
  process.exit(1);
}

const videoPath = path.join(folder, videoFile);
console.log(`Detected video → ${videoFile}`);
console.log(`Full path → ${videoPath}`);


const accessToken = 'sbawk2c58zehba4ad3'; 


function httpRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch { resolve({ status: res.statusCode, data }); }
      });
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function postToTikTok() {
  console.log('Starting TikTok sandbox upload...');

  try {
    // Step 1: Init
    const initRes = await httpRequest({
      hostname: 'open.tiktokapis.com',
      path: '/v2/post/publish/content/init/',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    }, JSON.stringify({
      post_info: {
        title: "RealityGlitch247 Test",
        description: "Reality Glitch What If Short — sandbox demo #WhatIf #AIGenerated",
        privacy_level: "SELF_ONLY",
        disable_comment: true,
        disable_duet: true,
        disable_stitch: true
      },
      source_info: {
        source: "FILE_UPLOAD",
        video_size: fs.statSync(videoPath).size
      }
    }));

    if (initRes.status !== 200) throw initRes.data;
    const { publish_id, upload_url } = initRes.data.data;
    console.log('Got upload URL');


    const videoBuffer = fs.readFileSync(videoPath);
    await httpRequest({
      hostname: new URL(upload_url).hostname,
      path: new URL(upload_url).pathname + new URL(upload_url).search,
      method: 'PUT',
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Length': videoBuffer.length
      }
    }, videoBuffer);
    console.log('Video uploaded');


    let status = '';
    while (!['PUBLISHED', 'FAILED'].includes(status)) {
      await new Promise(r => setTimeout(r, 8000));
      const poll = await httpRequest({
        hostname: 'open.tiktokapis.com',
        path: '/v2/post/publish/status/fetch/',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }, JSON.stringify({ publish_id }));

      status = poll.data.data?.status || 'UNKNOWN';
      console.log('Current status →', status);
    }

    console.log('SANDBOX UPLOAD SUCCESSFUL! Video is live (visible only to you)');
  } catch (e) {
    console.error('Upload failed:', JSON.stringify(e, null, 2));
  }
}

postToTikTok();