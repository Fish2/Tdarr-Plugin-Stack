//TODO Make sure only one video stream
function details() {
  return {
    id: "Tdarr_Plugin_Fish2_P5_CleanVideo",
    Stage: "Pre-processing",
    Name: "Fish2-Clean Video Streams",
    Type: "Video",
    Operation: "Clean",
    Description: "This plugin keeps only specified Video Stream and removes titles. \n\n",
    Version: "1.1",
    Link: "",
    Tags: "pre-processing,ffmpeg,video only",
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

  for (var i = 0; i < file.ffProbeData.streams.length; i++) {
    if (file.ffProbeData.streams[i].codec_type.toLowerCase() == "video") {
      try {
        if (typeof file.ffProbeData.streams[i].tags.language != "undefined") {
          response.infoLog += "☒Video stream detected as having language tag, Removing.\n";
          extraArguments += `-metadata:s:v:${videoIdx} language="" -disposition:${i} default `;
          convert = true;
        }
      } catch (err) {}
      if (file.ffProbeData.streams[i].disposition.default === 0) {
        if (videoIdx == 0) {
          extraArguments += `-disposition:${i} default `;
        }
      }
      videoIdx++;
    }
  }

  if (videoIdx >= 2) {
    response.infoLog += "☒File has more than one Video stream. \n";
  }

  if (convert === true) {
    response.processFile = true;
    response.reQueueAfter = true;
    response.preset = `,-map 0 ${extraArguments} -c copy -max_muxing_queue_size 4096`;
    response.infoLog += "☒File has Video tag, removing. \n";
  } else {
    response.processFile = false;
    response.infoLog += "☑File doesn't contain any video tags. \n";
  }
  return response;
}

module.exports.details = details;
module.exports.plugin = plugin;
