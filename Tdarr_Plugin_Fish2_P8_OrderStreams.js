function details() {
  return {
    id: "Tdarr_Plugin_Fish2_P8_OrderStreams",
    Stage: "Pre-processing",
    Name: "Fish2-ReOrder Streams",
    Type: "Streams",
    Operation: "Order",
    Description: "Orders streams into Video first, then Audio (2ch, 6ch, 8ch) and finally Subtitles. \n\n",
    Version: "1.1",
    Link: "",
    Tags: "pre-processing,ffmpeg,",
  };
}

function plugin(file, librarySettings) {
  var response = {
    processFile: false,
    container: "." + file.container,
    handBrakeMode: false,
    FFmpegMode: true,
    reQueueAfter: false,
    infoLog: "",
  };

  // Check if file is a video. If it isn't then exit plugin.
  if (file.fileMedium !== "video") {
    console.log("File is not video");
    response.infoLog += "☒File is not video. \n";
    response.processFile = false;
    return response;
  }

  // Set up required variables.
  var videoIdx = 0;
  var audioIdx = 0;
  var audio2Idx = 0;
  var audio6Idx = 0;
  var audio8Idx = 0;
  var audioTruehdIdx = 0;
  var subtitleIdx = 0;
  var extraArguments = "";
  var convert = false;

  // Go through each stream in the file.
  for (var i = 0; i < file.ffProbeData.streams.length; i++) {
    try {
      // Check if stream is video.
      if (file.ffProbeData.streams[i].codec_type.toLowerCase() == "video") {
        // Check if audioIdx or subtitleIdx do NOT equal 0, if they do then it means a audio or subtitle track has already appeared before the video track so file needs to be organized.
        if (audioIdx != "0" || subtitleIdx != "0") {
          convert = true;
          response.infoLog += "☒ Video not first. \n";
        }
        videoIdx++;
      }

      // Check if stream is audio.
      if (file.ffProbeData.streams[i].codec_type.toLowerCase() == "audio") {
        // Check if subtitleIdx does NOT equal 0, if it does then it means a subtitle track has already appeared before an audio track so file needs to be organized.
        if (subtitleIdx != "0") {
          convert = true;
          response.infoLog += "☒ Audio not second. \n";
        }
        audioIdx++;

        // Check if audio track is 2 channel.
        if (file.ffProbeData.streams[i].channels == "2") {
          // Check if audio6Idx or audio8Idx do NOT equal 0, if they do then it means a 6 channel or 8 channel audio track has already appeared before the 2 channel audio track so file needs to be organized.
          if (audio6Idx != "0" || audio8Idx != "0" || audioTruehdIdx != "0") {
            convert = true;
            response.infoLog += "☒ Audio 2ch not first. \n";
          }
          audio2Idx++;
        }
        // Check if audio track is 6 channel.
        if (file.ffProbeData.streams[i].channels == "6" && (file.ffProbeData.streams[i].codec_name != "truehd" || file.ffProbeData.streams[i].profile != "DTS-HD MA")) {
          // Check if audio8Idx does NOT equal 0, if it does then it means a 8 channel audio track has already appeared before the 6 channel audio track so file needs to be organized.
          if (audio8Idx != "0" || audioTruehdIdx != "0") {
            convert = true;
            response.infoLog += "☒ Audio 6ch not second. \n";
          }
          audio6Idx++;
        }

        // Check if audio track is 8 channel.
        if (file.ffProbeData.streams[i].channels == "8" && (file.ffProbeData.streams[i].codec_name != "truehd" || file.ffProbeData.streams[i].profile != "DTS-HD MA")) {
          if (audioTruehdIdx != "0") {
            convert = true;
            response.infoLog += "☒ Audio 8ch not third. \n";
          }
          audio8Idx++;
        }

        if (file.ffProbeData.streams[i].channels >= "6" && (file.ffProbeData.streams[i].codec_name == "truehd" || file.ffProbeData.streams[i].profile == "DTS-HD MA")) {
          audioTruehdIdx++;
        }
      }

      // Check if stream is subtitle.
      if (file.ffProbeData.streams[i].codec_type.toLowerCase() == "subtitle") {
        subtitleIdx++;
      }
    } catch (err) {}
  }

  // Go through each stream in the file.
  for (var i = 0; i < file.ffProbeData.streams.length; i++) {
    try {
      // Check if stream is video
      if (file.ffProbeData.streams[i].codec_type.toLowerCase() == "video") {
        extraArguments += `-map 0:${i} `;
      }
    } catch (err) {}
  }
  for (var i = 0; i < file.ffProbeData.streams.length; i++) {
    try {
      // Check if stream is audio AND 2 channel.
      if (file.ffProbeData.streams[i].codec_type.toLowerCase() == "audio" && file.ffProbeData.streams[i].channels == "2") {
        extraArguments += `-map 0:${i} `;
      }
    } catch (err) {}
  }
  for (var i = 0; i < file.ffProbeData.streams.length; i++) {
    try {
      // Check if stream is audio AND 6 channel and not truehd.
      if (file.ffProbeData.streams[i].codec_type.toLowerCase() == "audio" && (file.ffProbeData.streams[i].codec_name != "truehd" || file.ffProbeData.streams[i].profile != "DTS-HD MA") && file.ffProbeData.streams[i].channels == "6") {
        extraArguments += `-map 0:${i} `;
      }
    } catch (err) {}
  }
  for (var i = 0; i < file.ffProbeData.streams.length; i++) {
    try {
      // Check if stream is audio AND 8 channel and not truehd.
      if (file.ffProbeData.streams[i].codec_type.toLowerCase() == "audio" && (file.ffProbeData.streams[i].codec_name != "truehd" || file.ffProbeData.streams[i].profile != "DTS-HD MA") && file.ffProbeData.streams[i].channels == "8") {
        extraArguments += `-map 0:${i} `;
      }
    } catch (err) {}
  }
  for (var i = 0; i < file.ffProbeData.streams.length; i++) {
    try {
      // Check if stream is audio AND 6 channel or more and is truehd.
      if (file.ffProbeData.streams[i].codec_type.toLowerCase() == "audio" && (file.ffProbeData.streams[i].codec_name == "truehd" || file.ffProbeData.streams[i].profile == "DTS-HD MA") && file.ffProbeData.streams[i].channels >= "6") {
        extraArguments += `-map 0:${i} `;
      }
    } catch (err) {}
  }
  for (var i = 0; i < file.ffProbeData.streams.length; i++) {
    try {
      // Check if stream is audio AND not 2, 6 or 8 channel.
      if (file.ffProbeData.streams[i].codec_type.toLowerCase() == "audio" && file.ffProbeData.streams[i].channels != "2" && file.ffProbeData.streams[i].channels != "6" && file.ffProbeData.streams[i].channels != "8") {
        extraArguments += `-map 0:${i} `;
      }
    } catch (err) {}
  }
  for (var i = 0; i < file.ffProbeData.streams.length; i++) {
    try {
      // Check if stream is subtitle.
      if (file.ffProbeData.streams[i].codec_type.toLowerCase() == "subtitle") {
        extraArguments += `-map 0:${i} `;
      }
    } catch (err) {}
  }

  // Convert file if convert variable is set to true.
  if (convert === true) {
    response.processFile = true;
    response.reQueueAfter = true;
    response.preset = `,${extraArguments} -c copy -max_muxing_queue_size 4096`;
    response.infoLog += "☒ Streams are out of order, reorganizing streams. Video, Audio, Subtitles. \n";
  } else {
    response.processFile = false;
    response.infoLog += "☑ Streams are in expected order. \n ";
  }
  return response;
}

module.exports.details = details;
module.exports.plugin = plugin;
