function details() {
  return {
    id: "Tdarr_Plugin_Fish2_P1_ConvertVideo",
    Stage: "Pre-processing",
    Name: "Fish2-Convert Video Stream with Nvidia",
    Type: "Video",
    Operation: "Transcode",
    Description: "Files not in H265 or H264 will be transcoded into H265 using Nvidia GPU with ffmpeg, settings are dependant on file bitrate, NVDEC & NVENC compatable GPU required. \n\n",
    Version: "1.1",
    Link: "",
    Tags: "pre-processing,ffmpeg,video only,nvenc h265",
    Inputs: [{
        name: "max_file_bitrate",
        tooltip: `Specify Max average file bitrate
      	            \\nExample:\\n
      	            8000
                    \\nExample:\\n
                    6000`,
      },
      {
        name: "convert_h264",
        tooltip: `Convert H264 codec to H265 as well as other codecs
                    \\nExample:\\n
                    true
                    \\nExample:\\n
                    false`,
      },
    ],
  };
}

function plugin(file, librarySettings, inputs) {
  var response = {
    processFile: false,
    container: ".mkv",
    handBrakeMode: false,
    FFmpegMode: true,
    reQueueAfter: true,
    infoLog: "",
  };

  // Check if file is a video. If it isn't then exit plugin.
  if (file.fileMedium !== "video") {
    console.log("File is not video");
    response.infoLog += "☒File is not video. \n";
    response.processFile = false;
    return response;
  }

  // Get Current Overal Bit Rate
  var currentBitrate = 0;

  if (file.bit_rate != 0) {
    currentBitrate = ~~(file.bit_rate / 1000);
  } else if (typeof file.meta.Duration != "undefined") {
    currentBitrate = ~~(file.file_size / (file.meta.Duration * 0.000125));
  } else {
    currentBitrate = ~~(file.file_size / (file.ffProbeData.streams[0].duration * 0.000125));
  }

  // Set up required variables.
  var extraArguments = "";
  var bitrateSettings = "";
  var targetBitrate = ~~(currentBitrate * 0.5);
  var minimumBitrate = ~~(targetBitrate * 0.7);
  var maximumBitrate = ~~(targetBitrate * 1.3);
  var videoIdx = 0;
  var convert = false;
  var max_file_bitrateenable = false;
  var CPU10 = false;

  if (inputs.max_file_bitrate !== "") {
    max_file_bitrateenable = true;
  }

  // Go through each stream in the file.
  for (var i = 0; i < file.ffProbeData.streams.length; i++) {
    if (file.ffProbeData.streams[i].codec_name.toLowerCase() == "mov_text" || file.ffProbeData.streams[i].codec_name.toLowerCase() == "eia_608" || file.ffProbeData.streams[i].codec_name.toLowerCase() == "timed_id3") {
      response.infoLog += "☒File contains text, Removing. \n";
      extraArguments += `-map -0:d -map -0:${i} `;
    }
    if (file.ffProbeData.streams[i].codec_type.toLowerCase() == "video") {
      if (file.ffProbeData.streams[i].codec_name == "mjpeg" || file.ffProbeData.streams[i].codec_name == "png") {
        response.infoLog += "☒File contains images, Removing. \n";
        extraArguments += `-map -v:${videoIdx} `;
      }
      if (file.ffProbeData.streams[i].profile == "High 10" || file.ffProbeData.streams[i].bits_per_raw_sample == "10") {
        response.infoLog += "☒File is HDR / 10Bit. \n";
        CPU10 = true;
      }
      if (file.ffProbeData.streams[i].codec_name != "hevc" || (file.ffProbeData.streams[i].codec_name == "h264" && inputs.convert_h264 == "true")) {
        response.infoLog += "☒File is not in correct codec, Converting.\n";
        convert = true;
      }
      if (max_file_bitrateenable == true) {
        if (file.ffProbeData.streams[i].codec_name != "hevc" && currentBitrate >= inputs.max_file_bitrate) {
          response.infoLog += "☒Stream bit Rate to high, Converting. \n";
          convert = true;
        }
        if (file.ffProbeData.streams[i].codec_name == "hevc" && currentBitrate >= inputs.max_file_bitrate) {
          response.infoLog += "☒h265 stream bit Rate to high, Converting. \n";
          convert = true;
        }
      }
      if (file.container != "mkv" && convert == false) {
        response.infoLog += "☒File is not in correct container (mkv), Remuxing. \n";
        response.preset = `, -map 0 -c copy ${extraArguments} `;
        response.processFile = true;
        return response;
      }
      videoIdx++;
    }
  }

  if (convert === true) {
    if (targetBitrate == 0) {
      response.infoLog += "☒Target bitrate could not be calculated, Remuxing to get bitrate. \n";
      response.preset = `, -map 0 -c copy ${extraArguments} `;
      response.processFile = true;
      return response;
    } else if (inputs.max_file_bitrate !== "" && targetBitrate >= inputs.max_file_bitrate) {
      targetBitrate = (inputs.max_file_bitrate * 0.1);
      minimumBitrate = ~~(targetBitrate * 0.7);
      maximumBitrate = ~~(targetBitrate * 1.3);
      response.infoLog += `☒Target bitrate more than configerd, Setting to ${inputs.max_file_bitrate} \n`;
    }

    bitrateSettings = `-b:v ${targetBitrate}k -minrate ${minimumBitrate}k -maxrate ${maximumBitrate}k -bufsize ${currentBitrate}k`;
    response.infoLog += `Current bitrate = ${currentBitrate} \n Bitrate settings: \nTarget = ${targetBitrate} \nMinimum = ${minimumBitrate} \nMaximum = ${maximumBitrate} \n`;

    // Codec will be checked so it can be transcoded correctly
    if (file.video_codec_name == "h263") {
      response.preset = `-c:v nvdec`;
    } else if (file.video_codec_name == "h264" && CPU10 === false) {
      response.preset = `-c:v h264_cuvid`;
    } else if (file.video_codec_name == "hevc") {
      response.preset = `-c:v hevc_cuvid`;
    } else if (file.video_codec_name == "mjpeg") {
      response.preset = `-c:v mjpeg_cuvid`;
    } else if (file.video_codec_name == "mpeg1") {
      response.preset = `-c:v mpeg1_cuvid`;
    } else if (file.video_codec_name == "mpeg2") {
      response.preset = `-c:v mpeg2_cuvid`;
    } else if (file.video_codec_name == "mpeg4") {
      response.preset = `-c:v mpeg4_cuvid`;
    } else if (file.video_codec_name == "vc1") {
      response.preset = `-c:v vc1_cuvid`;
    } else if (file.video_codec_name == "vp8") {
      response.preset = `-c:v vp8_cuvid`;
    } else if (file.video_codec_name == "vp9") {
      response.preset = `-c:v vp9_cuvid`;
    }

    response.processFile = true;
    response.reQueueAfter = true;
    response.preset = `,-map 0 -c:v hevc_nvenc -rc:v vbr_hq -qmin 5 -cq:v 19 ${bitrateSettings} -preset 7 -rc-lookahead:v 60 -spatial_aq:v 1 -c:a copy -c:s copy -max_muxing_queue_size 9999 ${extraArguments}`;
    response.infoLog += "☒File is not in wanted format, Transcoding. \n";
  } else {
    response.processFile = false;
    response.infoLog += "☑File is already in correct codec and in correct container (mkv). \n";
  }
  return response;
}

module.exports.details = details;
module.exports.plugin = plugin;
