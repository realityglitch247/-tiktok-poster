
const https = require('https');
const fs = require('fs');
const path = require('path');


const folder = __dirname;
const files = fs.readdirSync(folder);
const videoFile = files.find(f => f.toLowerCase() === 'demo_video.mp4');

if (!videoFile) {
  console.error('ERROR: demo_video.mp4 not found!');
  console.log('Files in folder:', files);
  process.exit(1);
}

const videoPath = path.join(folder, videoFile);
console.log(`Detected video → ${videoFile}`);
console.log(`Full path     → ${videoPath}\n`);


const accessToken = 'sbawk2c58zehba4ad3';
async function postToTikTok() {
  console.log('Starting TikTok Content Posting API flow...\n');

  try {

    const initRes = await httpPost('https://open.tiktokapis.com/v2/post/publish/content/init/', {
      post_info: {
        title: "RealityGlitch247 Demo",
        description: "AI glitch Short — automated upload demo #WhatIf #AIGenerated",
        privacy_level: "SELF_ONLY",
        disable_comment: true,
        disable_duet: true,
        disable_stitch: true
      },
      source_info: {
        source: "FILE_UPLOAD",
        video_size: fs.statSync(videoPath).size
      }
    });

    const { publish_id, upload_url } = init.data;
    console.log('Init successful → publish_id received');
    console.log('Upload URL received\n');


    const videoBuffer = fs.readFileSync(videoPath);
    await httpPut(upload_url, videoBuffer);
    console.log('Video successfully uploaded to TikTok\n');


    let status = '';
    while (!['PUBLISHED', 'FAILED'].includes(status)) {
      await new Promise(r => setTimeout(r, 8000));
      const poll = await httpPost('https://open.tiktokapis.com/v2/post/publish/status/fetch/', { publish_id });
      status = poll.data?.status || 'UNKNOWN';
      console.log(`Polling status → ${status}`);
    }

    console.log('\nUPLOAD FLOW COMPLETED');
    if (status === 'PUBLISHED') {
      console.log('Video is live in sandbox (visible only to you)!');
    } else {
      console.log('Upload finished with status:', status);
    }
  } catch (e) {
    console.error('\nAPI CALL FAILED (expected in sandbox without valid token):');
    console.error(JSON.stringify(e, null, 2));
  }
}

// Helper functions (native Node.js)
function httpPost(url, jsonBody) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ data: JSON.parse(data), status: res.statusCode }); }
        catch { resolve({ data, status: res.statusCode }); }
      });
    });
    req.on('error', reject);
    req.write(JSON.stringify(jsonBody));
    req.end();
  });
}

function httpPut(url, buffer) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Length': buffer.length
      }
    }, res => res.on('end', () => resolve()));
    req.on('error', reject);
    req.write(buffer);
    req.end();
  });
}

postToTikTok();
