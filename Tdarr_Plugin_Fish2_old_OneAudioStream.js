function details() {
  return {
    id: "Tdarr_Plugin_Fish2_old_OneAudioStream",
    Stage: "Pre-processing",
    Name: "Fish2-One Audio Stream",
    Type: "Audio",
    Operation: "Clean",
    Description: `Remove all but one audio stream unless TrueHd which keeps one lowres. \n\n`,
    Version: "1.1",
    Link: "",
    Tags: "pre-processing,ffmpeg,audio only",
  };
}

function plugin(file, librarySettings) {
  var response = {
    processFile: false,
    container: "." + file.container,
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

  // Set up required variables.
  var audioIdx = 0;

  var totalaudioStreamCount = 0;
  var truehdaudioStreamCount = 0;
  var ac3audioStreamCount = 0;
  var aacaudioStreamCount = 0;
  var audioStreamsRemoved = 0;

  var extraArguments = "";
  var convert = false;

  // Get audioStreamCount and check for truehd
  for (var i = 0; i < file.ffProbeData.streams.length; i++) {
    try {
      if (file.ffProbeData.streams[i].codec_type.toLowerCase() == "audio") {
        // Check if truehd exists
        if (file.ffProbeData.streams[i].codec_name == "truehd") {
          truehdaudioStreamCount++
        }
        // Check AC3 and get Bitrates
        if (file.ffProbeData.streams[i].codec_name == "ac3") {
          ac3audioStreamCount++
          if (file.ffProbeData.streams[i].tags.BitRate >= "640000") {
            //if more or the same as 640k
          } else if (file.ffProbeData.streams[i].tags.BitRate <= "448000") {
            //if less or the same as 448k
          }
        }
        // Check For 2 channel aac
        if (file.ffProbeData.streams[i].channels == "2" && file.ffProbeData.streams[i].codec_name !== "aac") {
          aacaudioStreamCount++
        }
      }
      totalaudioStreamCount++
    } catch (err) {}
  }
  response.infoLog += `Total = ${totalaudioStreamCount} Total TrueHD = ${truehdaudioStreamCount} Total AC3 = ${ac3audioStreamCount} Total AAC = ${aacaudioStreamCount} \n`;

  if (truehdaudioStreamCount >= 1) {
    //Remove some audio
  }

  if (ac3audioStreamCount >= 1) {
    //Remove some audio
  }

  if (aacaudioStreamCount >= 1) {
    //Remove some audio
  }

  if (ac3audioStreamCount >= 1 && aacaudioStreamCount >= 1) {
    //Remove aac
  }



  //Keep 2 audio steams if truehd (Keep (TrueHD + AC3)) Keep 1 audio stream if no truehd (Keep (AC3))
  if (truehdaudioStreamCount >= 1) {
    if (totalaudioStreamCount >= 2) {
      //remove a stream
    }
  } else {
    if (totalaudioStreamCount >= 1) {
      //remove a stream
    }
  }

  if (audioStreamsRemoved == totalaudioStreamCount) {
    response.infoLog += "☒Cancelling plugin otherwise all audio tracks would be removed. \n";
    response.processFile = false;
    return response;
  }

  // Convert file if convert variable is set to true.
  if (convert === true) {
    response.processFile = true;
    response.preset = `,-map 0 -c copy ${extraArguments} -max_muxing_queue_size 4096`;
    response.infoLog += "☒File contains more than one audio stream. \n";
  } else {
    response.processFile = false;
    response.infoLog += "☑File doesn't contain more than one audio stream. \n";
  }
  return response;
}

module.exports.details = details;
module.exports.plugin = plugin;






//old stuff
if (file.ffProbeData.streams[i].codec_type.toLowerCase() == "audio") {
  try {
    if (language.indexOf(file.ffProbeData.streams[i].tags.language.toLowerCase()) === -1) {
      audioStreamsRemoved++;
      response.infoLog += `☒Audio stream detected as being an unwanted language, removing. Audio stream 0:a:${audioIdx} - ${file.ffProbeData.streams[i].tags.language.toLowerCase()} \n`;
      removeaudio = true;
    }
  } catch (err) {}
  try {
    if (file.ffProbeData.streams[i].tags.title.toLowerCase().includes("commentary") ||
      file.ffProbeData.streams[i].tags.title.toLowerCase().includes("description") ||
      file.ffProbeData.streams[i].tags.title.toLowerCase().includes("sdh")) {
      audioStreamsRemoved++;
      response.infoLog += `☒Audio stream detected as being Commentary or Description, removing. Audio stream 0:a:${audioIdx} - ${file.ffProbeData.streams[i].tags.title}. \n`;
      removeaudio = true;
    }
  } catch (err) {}
  if (inputs.impaired_comments == "true" &&
    (file.ffProbeData.streams[i].disposition.hearing_impaired === 1 ||
      file.ffProbeData.streams[i].disposition.visual_impaired === 1 ||
      file.ffProbeData.streams[i].disposition.comment === 1)) {
    audioStreamsRemoved++;
    response.infoLog += `☒Audio stream detected as being Commentary or Description, removing. Audio stream 0:a:${audioIdx} - ${file.ffProbeData.streams[i].tags.title}. \n`;
    removeaudio = true;
  }






  if (file.ffProbeData.streams[i].codec_type.toLowerCase() == "audio" && file.ffProbeData.streams[i].codec_name == "truehd") {
    istruehd = true;
  }

  if (audioStreamCount >= 1 && istruehd == false) {
      removeaudio = true;
  } else






  // Check if inputs.tag_language has something entered (Entered means user actually wants something to happen, empty would disable this) AND checks that stream is audio.
  if (inputs.tag_language != "") {
    // Look for audio with "und" as metadata language.
    try {
      if (file.ffProbeData.streams[i].tags.language.toLowerCase().includes("und")) {
        extraArguments += `-metadata:s:a:${audioIdx} language=${inputs.tag_language} `;
        response.infoLog += `☒Audio stream detected as having unknown language tagged, tagging as ${inputs.tag_language}. \n`;
        convert = true;
      }
    } catch (err) {}
    // Checks if the tags metadata is completely missing, if so this would cause playback to show language as "undefined". No catch error here otherwise it would never detect the metadata as missing.
    if (typeof file.ffProbeData.streams[i].tags == "undefined") {
      extraArguments += `-metadata:s:a:${audioIdx} language=${inputs.tag_language} `;
      response.infoLog += `☒Audio stream detected as having no language tagged, tagging as ${inputs.tag_language}. \n`;
      convert = true;
    }
    // Checks if the tags.language metadata is completely missing, if so this would cause playback to show language as "undefined". No catch error here otherwise it would never detect the metadata as missing.
    else {
      if (typeof file.ffProbeData.streams[i].tags.language == "undefined") {
        extraArguments += `-metadata:s:a:${audioIdx} language=${inputs.tag_language} `;
        response.infoLog += `☒Audio stream detected as having no language tagged, tagging as ${inputs.tag_language}. \n`;
        convert = true;
      }
    }
  }






  function details() {
  return {
    id: "Tdarr_Plugin_MC93_Migz3CleanAudio",
    Stage: "Pre-processing",
    Name: "Migz-Clean audio streams",
    Type: "Audio",
    Operation: "Clean",
    Description: `This plugin keeps only specified language audio tracks & can tags those that have an unknown language. \n\n`,
    Version: "2.2",
    Link:
      "https://github.com/HaveAGitGat/Tdarr_Plugins/blob/master/Community/Tdarr_Plugin_MC93_Migz3CleanAudio.js",
    Tags: "pre-processing,ffmpeg,audio only,configurable",
    Inputs: [
      {
        name: "language",
        tooltip: `Specify language tag/s here for the audio tracks you'd like to keep, recommended to keep "und" as this stands for undertermined, some files may not have the language specified. Must follow ISO-639-2 3 letter format. https://en.wikipedia.org/wiki/List_of_ISO_639-2_codes
  	            \\nExample:\\n
  	            eng

  	            \\nExample:\\n
  	            eng,und

  	            \\nExample:\\n
  	            eng,und,jap`,
      },
      {
        name: "commentary",
        tooltip: `Specify if audio tracks that contain commentary/description should be removed.
  	            \\nExample:\\n
  	            true

  	            \\nExample:\\n
  	            false`,
      },
      {
        name: "tag_language",
        tooltip: `Specify a single language for audio tracks with no language or unknown language to be tagged with, leave empty to disable, you must have "und" in your list of languages to keep for this to function. Must follow ISO-639-2 3 letter format. https://en.wikipedia.org/wiki/List_of_ISO_639-2_codes
  	            \\nExample:\\n
  	            eng

  	            \\nExample:\\n
  	            por`,
      },
      {
        name: "tag_title",
        tooltip: `Specify audio tracks with no title to be tagged with the number of channels they contain. Do NOT use this with mp4, as mp4 does not support title tags.
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
    preset: "",
    container: "." + file.container,
    handBrakeMode: false,
    FFmpegMode: true,
    reQueueAfter: false,
    infoLog: "",
  };

  // Check if file is a video. If it isn't then exit plugin.
  if (file.fileMedium !== "video") {
    console.log("File is not video");
    response.infoLog += "☒File is not video \n";
    response.processFile = false;
    return response;
  }

  // Check if inputs.language has been configured. If it hasn't then exit plugin.
  if (inputs.language == "") {
    response.infoLog +=
      "☒Language/s keep have not been configured within plugin settings, please configure required options. Skipping this plugin.  \n";
    response.processFile = false;
    return response;
  }

  // Set up required variables.
  var language = inputs.language.split(",");
  var ffmpegCommandInsert = "";
  var convert = false;
  var audioIdx = 0;
  var audioStreamsRemoved = 0;
  var audioStreamCount = file.ffProbeData.streams.filter(
    (row) => row.codec_type.toLowerCase() == "audio"
  ).length;

  for (var i = 0; i < file.ffProbeData.streams.length; i++) {
    // Catch error here incase the language metadata is completely missing.
    try {
      // Check if stream is audio AND checks if the tracks language code does not match any of the languages entered in inputs.language.
      if (
        file.ffProbeData.streams[i].codec_type.toLowerCase() == "audio" &&
        language.indexOf(
          file.ffProbeData.streams[i].tags.language.toLowerCase()
        ) === -1
      ) {
        audioStreamsRemoved++;
        ffmpegCommandInsert += `-map -0:a:${audioIdx} `;
        response.infoLog += `☒Audio stream detected as being an unwanted language, removing. Audio stream 0:a:${audioIdx} - ${file.ffProbeData.streams[
          i
        ].tags.language.toLowerCase()} \n`;
        convert = true;
      }
    } catch (err) {}

    // Catch error here incase the title metadata is completely missing.
    try {
      // Check if inputs.commentary is set to true AND if stream is audio AND then checks for stream titles with the following "commentary, description, sdh". Removing any streams that are applicable.
      if (
        inputs.commentary.toLowerCase() == "true" &&
        file.ffProbeData.streams[i].codec_type.toLowerCase() == "audio" &&
        (file.ffProbeData.streams[i].tags.title
          .toLowerCase()
          .includes("commentary") ||
          file.ffProbeData.streams[i].tags.title
            .toLowerCase()
            .includes("description") ||
          file.ffProbeData.streams[i].tags.title.toLowerCase().includes("sdh"))
      ) {
        audioStreamsRemoved++;
        ffmpegCommandInsert += `-map -0:a:${audioIdx} `;
        response.infoLog += `☒Audio stream detected as being Commentary or Description, removing. Audio stream 0:a:${audioIdx} - ${file.ffProbeData.streams[i].tags.title}. \n`;
        convert = true;
      }
    } catch (err) {}

    // Check if inputs.tag_language has something entered (Entered means user actually wants something to happen, empty would disable this) AND checks that stream is audio.
    if (
      inputs.tag_language != "" &&
      file.ffProbeData.streams[i].codec_type.toLowerCase() == "audio"
    ) {
      // Catch error here incase the metadata is completely missing.
      try {
        // Look for audio with "und" as metadata language.
        if (
          file.ffProbeData.streams[i].tags.language
            .toLowerCase()
            .includes("und")
        ) {
          ffmpegCommandInsert += `-metadata:s:a:${audioIdx} language=${inputs.tag_language} `;
          response.infoLog += `☒Audio stream detected as having unknown language tagged, tagging as ${inputs.tag_language}. \n`;
          convert = true;
        }
      } catch (err) {}

      // Checks if the tags metadata is completely missing, if so this would cause playback to show language as "undefined". No catch error here otherwise it would never detect the metadata as missing.
      if (typeof file.ffProbeData.streams[i].tags == "undefined") {
        ffmpegCommandInsert += `-metadata:s:a:${audioIdx} language=${inputs.tag_language} `;
        response.infoLog += `☒Audio stream detected as having no language tagged, tagging as ${inputs.tag_language}. \n`;
        convert = true;
      }
      // Checks if the tags.language metadata is completely missing, if so this would cause playback to show language as "undefined". No catch error here otherwise it would never detect the metadata as missing.
      else {
        if (typeof file.ffProbeData.streams[i].tags.language == "undefined") {
          ffmpegCommandInsert += `-metadata:s:a:${audioIdx} language=${inputs.tag_language} `;
          response.infoLog += `☒Audio stream detected as having no language tagged, tagging as ${inputs.tag_language}. \n`;
          convert = true;
        }
      }
    }

    try {
      // Check if title metadata is missing from any streams AND inputs.tag_title set to true AND if stream type is audio. Add title to any applicable streams.
      if (
        typeof file.ffProbeData.streams[i].tags.title == "undefined" &&
        inputs.tag_title.toLowerCase() == "true" &&
        file.ffProbeData.streams[i].codec_type.toLowerCase() == "audio"
      ) {
        if (file.ffProbeData.streams[i].channels == "8") {
          ffmpegCommandInsert += `-metadata:s:a:${audioIdx} title="7.1" `;
          response.infoLog += `☒Audio stream detected as 8 channel audio track with no title, tagging title. Audio stream 0:a:${audioIdx} tagged as "7.1" \n`;
          convert = true;
        }
        if (file.ffProbeData.streams[i].channels == "6") {
          ffmpegCommandInsert += `-metadata:s:a:${audioIdx} title="5.1" `;
          response.infoLog += `☒Audio stream detected as 6 channel audio track with no title, tagging title. Audio stream 0:a:${audioIdx} tagged as "5.1" \n`;
          convert = true;
        }
        if (file.ffProbeData.streams[i].channels == "2") {
          ffmpegCommandInsert += `-metadata:s:a:${audioIdx} title="2.0" `;
          response.infoLog += `☒Audio stream detected as 2 channel audio track with no title, tagging title. Audio stream 0:a:${audioIdx} tagged as "2.0" \n`;
          convert = true;
        }
      }
    } catch (err) {}

    // Check if stream type is audio and increment audioIdx if true.
    if (file.ffProbeData.streams[i].codec_type.toLowerCase() == "audio") {
      audioIdx++;
    }
  }
  // Failsafe to cancel processing if all streams would be removed following this plugin. We don't want no audio.
  if (audioStreamsRemoved == audioStreamCount) {
    response.infoLog +=
      "☒Cancelling plugin otherwise all audio tracks would be removed. \n";
    response.processFile = false;
    return response;
  }

  // Convert file if convert variable is set to true.
  if (convert === true) {
    response.processFile = true;
    response.preset = `, -map 0 ${ffmpegCommandInsert} -c copy -max_muxing_queue_size 4096`;
    response.container = "." + file.container;
    response.reQueueAfter = true;
  } else {
    response.processFile = false;
    response.infoLog +=
      "☑File doesn't contain audio tracks which are unwanted or that require tagging.\n";
  }
  return response;
}
module.exports.details = details;
module.exports.plugin = plugin;










  var truehdAudioStreamCount = 0;
  var ac3AudioStreamCount = 0;
  var aacAudioStreamCount = 0;
  var totalAudioStreamCount = 0;

  for (var i = 0; i < file.ffProbeData.streams.length; i++) {
    if (file.ffProbeData.streams[i].codec_type.toLowerCase() == "audio") {
      // Check if truehd exists
      if (file.ffProbeData.streams[i].channels >= "6" && (file.ffProbeData.streams[i].codec_name == "truehd" || file.ffProbeData.streams[i].profile == "DTS-HD MA")) {
        truehdAudioStreamCount++
        var truehdAudioStreamBitrate[i] = file.ffProbeData.streams[i].tags.BitRate;
      }
      // Check AC3 and get Bitrates
      if (file.ffProbeData.streams[i].codec_name == "ac3") {
        ac3AudioStreamCount++
        var ac3AudioStreamBitrate[i] = file.ffProbeData.streams[i].tags.BitRate;
      }
      // Check For 2 channel aac
      if (file.ffProbeData.streams[i].channels == "2" && file.ffProbeData.streams[i].codec_name !== "aac") {
        aacAudioStreamCount++
        var aacAudioStreamBitrate[i] = file.ffProbeData.streams[i].tags.BitRate;
      }
      totalAudioStreamCount++
    }
  }
