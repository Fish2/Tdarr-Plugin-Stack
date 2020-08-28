function details() {
  return {
    id: "Tdarr_Plugin_Fish2_P4_ImageRemoval",
    Stage: "Pre-processing",
    Name: "Fish2-Remove Image Formats",
    Type: "Video",
    Operation: "Clean",
    Description: "Remove all image formats MJPEG and PNG. \n\n",
    Version: "1.1",
    Link: "",
    Tags: "pre-processing,ffmpeg",
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
  var extraArguments = "";
  var convert = false;
  var videoIdx = 0;

  // Go through each stream in the file.
  for (var i = 0; i < file.ffProbeData.streams.length; i++) {
    if (file.ffProbeData.streams[i].codec_type.toLowerCase() == "video") {
      try {
        if (file.ffProbeData.streams[i].codec_name == "mjpeg" || file.ffProbeData.streams[i].codec_name == "png") {
          response.infoLog += "☒Stream is image, Removing. \n";
          extraArguments += `-map -v:${videoIdx} `;
          convert = true;
        }
      } catch (err) {}
      videoIdx++;
    }
  }

  if (convert === true) {
    response.processFile = true;
    response.reQueueAfter = true;
    response.preset = `,-map 0 ${extraArguments} -c copy -max_muxing_queue_size 4096`;
    response.infoLog += "☒File has image stream, Removing. \n";
  } else {
    response.processFile = false;
    response.infoLog += "☑File doesn't contain any unwanted image format streams. \n";
  }
  return response;
}

module.exports.details = details;
module.exports.plugin = plugin;
