function details() {
  return {
    id: "Tdarr_Plugin_Fish2_P3_MetadataRemoval",
    Stage: "Pre-processing",
    Name: "Fish2-Remove Title Metadata",
    Type: "Video",
    Operation: "Clean",
    Description: "Remove all Metadata from all streams.\n\n",
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
  var audioIdx = 0;
  var subtitleIdx = 0;

  // Check if overall file metadata title is not empty, if it's not empty set to "".
  if (typeof file.meta.Title != "undefined") {
    try {
      response.infoLog += "☒File meta title exists, Removing Meta. \n";
      extraArguments += ` -metadata title="" `;
      convert = true;
    } catch (err) {}
  }

  // Go through each stream in the file.
  for (var i = 0; i < file.ffProbeData.streams.length; i++) {
    try {
      if (file.ffProbeData.streams[i].codec_type.toLowerCase() == "video") {
        if (typeof file.ffProbeData.streams[i].tags.title != "undefined") {
          response.infoLog += "☒Video stream title is not empty, Removing Meta. \n";
          extraArguments += ` -metadata:s:v:${videoIdx} title="" `;
          convert = true;
        }
        videoIdx++;
      }
    } catch (err) {}
    try {
      if (file.ffProbeData.streams[i].codec_type.toLowerCase() == "audio") {
        if (file.ffProbeData.streams[i].tags.title.split(".").length - 1 > 3) {
          response.infoLog += "☒Junk audio metadata, Removing Meta \n";
          extraArguments += ` -metadata:s:a:${audioIdx} title="" `;
          convert = true;
        }
        audioIdx++;
      }
    } catch (err) {}
    try {
      if (file.ffProbeData.streams[i].codec_type.toLowerCase() == "subtitle") {
        if (file.ffProbeData.streams[i].tags.title.split(".").length - 1 > 3) {
          response.infoLog += "☒Junk sub metadata, Removing Meta.\n";
          extraArguments += ` -metadata:s:s:${subtitleIdx} title="" `;
          convert = true;
        }
        subtitleIdx++;
      }
    } catch (err) {}
  }

  if (convert === true) {
    response.processFile = true;
    response.reQueueAfter = true;
    response.preset = `,-map 0 ${extraArguments} -c copy -max_muxing_queue_size 9999`;
    response.infoLog += "☒File has metadata, Removing. \n";
  } else {
    response.processFile = false;
    response.infoLog += "☑File has no metadata. \n";
  }
  return response;
}

module.exports.details = details;
module.exports.plugin = plugin;
