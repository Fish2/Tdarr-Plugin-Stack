// Make so that if bitrate is low dont re encode higher
function details() {
  return {
    id: "Tdarr_Plugin_Fish2_P2_ConvertAudio",
    Stage: "Pre-processing",
    Name: "Fish2-Convert Audio Streams",
    Type: "Audio",
    Operation: "Transcode",
    Description: "This plugin can convert any audio other than TrueHD or DTS-HD MA track/s to AAC or AC3 if 2 channel or more TrueHD or DTS-HD MA get a ac3 track added. \n\n",
    Version: "1.1",
    Link: "",
    Tags: "pre-processing,ffmpeg,audio only",
    Inputs: [{
      name: "bitrate",
      tooltip: `Specify AC3 bitrate
      	            \\nExample:\\n
      	            640k
                    \\nExample:\\n
                    448k`,
    }, ],
  };
}

function plugin(file, librarySettings, inputs) {
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

  // Check if inputs.language has been configured. If it hasn't then exit plugin.
  if (inputs.bitrate === "") {
    response.infoLog += "☒Inputs have not been configured within plugin settings, please configure required options. Skipping this plugin. \n";
    response.processFile = false;
    return response;
  }

  // Set up required variables.
  var extraArguments = "";
  var convert = false;
  var ac3exists = false;
  var multichannelexists = false;
  var audioIdx = 0;
  var bitrate = inputs.bitrate.replace(/[^\d-]/g, '') * 1000;

  // Go through each stream in the file.
  for (var i = 0; i < file.ffProbeData.streams.length; i++) {
    if (file.ffProbeData.streams[i].codec_type.toLowerCase() == "audio" && file.ffProbeData.streams[i].codec_name == "ac3" && file.ffProbeData.streams[i].channels >= "6") {
      ac3exists = true;
    }
    if (file.ffProbeData.streams[i].codec_type.toLowerCase() == "audio" && file.ffProbeData.streams[i].channels >= "6") {
      multichannelexists = true;
    }
  }

  for (var i = 0; i < file.ffProbeData.streams.length; i++) {
    if (file.ffProbeData.streams[i].codec_type.toLowerCase() == "audio") {
      if (file.ffProbeData.streams[i].channels >= "6" && (file.ffProbeData.streams[i].codec_name == "truehd" || file.ffProbeData.streams[i].profile == "DTS-HD MA")) {
        if (ac3exists === false) {
          response.infoLog += "☒Audio stream is TrueHD or DTS-HD MA 6 channel or more but no 5.1 AC3 for compatibility, Adding.\n";
          if (file.ffProbeData.streams[i].profile == "DTS-HD MA") {
            extraArguments += `-map 0:${audioIdx} -c:a:${audioIdx} ac3 -ac 6 -b:a ${inputs.bitrate} -metadata:s:a:${audioIdx} title="5.1" -disposition:a:${audioIdx} default `;
          } else {
            extraArguments += `-map 0:${audioIdx} -c:a:${audioIdx} ac3 -ac 6 -b:a ${inputs.bitrate} -metadata:s:a:${audioIdx} title="5.1" -disposition:a:${audioIdx} default `;
          }
          convert = true;
        } else {
          response.infoLog += "☑Audio stream is TrueHD or DTS-HD MA 6 channel or more and AC3 for compatibility exists. \n";
        }
      } else if (ac3exists === false && file.ffProbeData.streams[i].channels >= "6" && file.ffProbeData.streams[i].codec_name == "aac") {
        response.infoLog += "☒Audio stream is AAC 6 channel or more but is not AC3, Converting. \n";
        extraArguments += `-map 0:${audioIdx} -c:a:${audioIdx} ac3 -ac 6 -metadata:s:a:${audioIdx} title="5.1" -disposition:a:${audioIdx} default `;
        convert = true;
      } else if ((ac3exists === false && file.ffProbeData.streams[i].channels >= "6" && file.ffProbeData.streams[i].codec_name != "ac3") || (file.ffProbeData.streams[i].codec_name == "ac3" && file.ffProbeData.streams[i].BitRate > bitrate)) {
        response.infoLog += "☒Audio stream is 6 channel or more but is not AC3 or not right bitrate, Converting. \n";
        extraArguments += `-c:a:${audioIdx} ac3 -ac 6 -b:a ${inputs.bitrate} -metadata:s:a:${audioIdx} title="5.1" -disposition:a:${audioIdx} default `;
        convert = true;
      } else if (multichannelexists === false && file.ffProbeData.streams[i].channels == "2" && file.ffProbeData.streams[i].codec_name != "aac") {
        response.infoLog += "☒Audio stream is 2 channel but is not AAC, Converting. \n";
        extraArguments += `-c:a:${audioIdx} aac -strict -2 -metadata:s:a:${audioIdx} title="2.0" -disposition:${audioIdx} default `;
        convert = true;
      }
    }
    audioIdx++;
  }

  if (convert === true) {
    response.processFile = true;
    response.reQueueAfter = true;
    response.preset = `,-map 0 -c copy ${extraArguments} -max_muxing_queue_size 4096`;
    response.infoLog += "☒File doesn't contain the right audio streams, Adding and Converting. \n";
  } else {
    response.processFile = false;
    response.infoLog += "☑File contains all required audio streams. \n";
  }
  return response;
}

module.exports.details = details;
module.exports.plugin = plugin;
