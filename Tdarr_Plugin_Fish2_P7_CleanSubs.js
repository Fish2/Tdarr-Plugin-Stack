function details() {
  return {
    id: "Tdarr_Plugin_Fish2_P7_CleanSubs",
    Stage: "Pre-processing",
    Name: "Fish2-Clean Subtitle Streams",
    Type: "Subtitle",
    Operation: "Clean",
    Description: "This plugin keeps only specified language subtitle tracks & can tag those that have an unknown language. \n\n",
    Version: "1.1",
    Link: "",
    Tags: "pre-processing,ffmpeg,subtitle only,configurable",
    Inputs: [{
        name: "forced_only",
        tooltip: `Keep Forced Subs Only
                    \\nExample:\\n
                    true

                    \\nExample:\\n
                    false`,
      },
      {
        name: "impaired_comments",
        tooltip: `Removes Impaired and Comments Subs
                    \\nExample:\\n
                    true

                    \\nExample:\\n
                    false`,
      },
      {
        name: "font_subs",
        tooltip: `Removes Fonts and Subs containing fonts
                    \\nExample:\\n
                    true

                    \\nExample:\\n
                    false`,
      },
      {
        name: "language",
        tooltip: `Specify language tag/s here for the subtitle tracks you'd like to keep. Must follow ISO-639-2 3 letter format. https://en.wikipedia.org/wiki/List_of_ISO_639-2_codes
  	                \\nExample:\\n
  	                eng

  	                \\nExample:\\n
  	                eng,jap`,
      },
      {
        name: "tag_language",
        tooltip: `Specify a single language for subtitle tracks with no language or unknown language to be tagged with, leave empty to disable. Must follow ISO-639-2 3 letter format. https://en.wikipedia.org/wiki/List_of_ISO_639-2_codes
  	                \\nExample:\\n
  	                eng

                    \\nExample:\\n
  	                por`,
      },
      {
        name: "title_language",
        tooltip: `Specify a single language for subtitle track title
  	                \\nExample:\\n
  	                English`,
      },
    ],
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
  if (inputs.forced_only === "" && inputs.impaired_comments === "" && inputs.language === "" && inputs.tag_language === "" && inputs.title_language === "") {
    response.infoLog += "☒Inputs have not been configured within plugin settings, please configure required options. Skipping this plugin. \n";
    response.processFile = false;
    return response;
  }

  // Set up required variables.
  var language = inputs.language.split(",");
  var extraArguments = "";
  var convert = false;
  var subtitleIdx = 0;
  var attachmentIdx = 0;
  var removesub = false;
  var forcedexists = false;

  // Go through each stream in the file.
  for (var i = 0; i < file.ffProbeData.streams.length; i++) {
    if (inputs.font_subs == "true") {
      try {
        if (file.ffProbeData.streams[i].codec_type.toLowerCase() == "subtitle") {
          if (file.ffProbeData.streams[i].codec_name == "ass") {
            removesub = true;
          }
        }
      } catch (err) {}
      try {
        if (file.ffProbeData.streams[i].codec_type.toLowerCase() == "attachment") {
          if (file.ffProbeData.streams[i].codec_name == "ttf") {
            extraArguments += `-map -0:t:${attachmentIdx} `;
            convert = true;
          }
          attachmentIdx++;
        }
      } catch (err) {}
    }
    if (file.ffProbeData.streams[i].codec_type.toLowerCase() == "subtitle") {
      try {
        if (language.indexOf(file.ffProbeData.streams[i].tags.language.toLowerCase()) === -1) {
          removesub = true;
        }
      } catch (err) {}

      try {
        if (file.ffProbeData.streams[i].tags.title.toLowerCase().includes("commentary") ||
          file.ffProbeData.streams[i].tags.title.toLowerCase().includes("description") ||
          file.ffProbeData.streams[i].tags.title.toLowerCase().includes("sdh")) {
          removesub = true;
        }
      } catch (err) {}
      if (inputs.impaired_comments == "true" &&
        (file.ffProbeData.streams[i].disposition.hearing_impaired === 1 ||
          file.ffProbeData.streams[i].disposition.visual_impaired === 1 ||
          file.ffProbeData.streams[i].disposition.comment === 1)) {
        removesub = true;
      }
      if (inputs.forced_only == "true" && file.ffProbeData.streams[i].disposition.forced !== 1) {
        removesub = true;
      }
      if (removesub === false && inputs.tag_language !== "") {
        if (file.ffProbeData.streams[i].disposition.forced === 1 && file.ffProbeData.streams[i].tags.title != "Forced") {
          extraArguments += `-metadata:s:s:${subtitleIdx} title="Forced" `;
          response.infoLog += "☒Subtitle stream detected as forced but no title, tagging as Forced. \n";
          forcedexists = true;
          convert = true;
        } else {
          if (typeof file.ffProbeData.streams[i].tags.title == "undefined" && file.ffProbeData.streams[i].tags.language == "eng") {
            extraArguments += `-metadata:s:s:${subtitleIdx} title=${inputs.title_language} `;
            response.infoLog += `☒Subtitle stream detected as eng but no title, tagging as ${inputs.tag_language}. \n`;
            convert = true;
          }
          // Look for subtitle with "und" as metadata language.
          try {
            if (file.ffProbeData.streams[i].tags.language.toLowerCase().includes("und")) {
              extraArguments += `-metadata:s:s:${subtitleIdx} language=${inputs.tag_language} title=${inputs.title_language} `;
              response.infoLog += `☒Subtitle stream detected as having unknown language tagged, tagging as ${inputs.tag_language}. \n`;
              convert = true;
            }
          } catch (err) {}
          // Checks if the tags metadata is completely missing, if so this would cause playback to show language as "undefined". No catch error here otherwise it would never detect the metadata as missing.
          if (typeof file.ffProbeData.streams[i].tags == "undefined") {
            extraArguments += `-metadata:s:s:${subtitleIdx} language=${inputs.tag_language} title=${inputs.title_language} `;
            response.infoLog += `☒Subtitle stream detected as having no language tagged, tagging as ${inputs.tag_language}. \n`;
            convert = true;
          }
          // Checks if the tags.language metadata is completely missing, if so this would cause playback to show language as "undefined". No catch error here otherwise it would never detect the metadata as missing.
          else if (typeof file.ffProbeData.streams[i].tags.language == "undefined") {
            extraArguments += `-metadata:s:s:${subtitleIdx} language=${inputs.tag_language} title=${inputs.title_language} `;
            response.infoLog += `☒Subtitle stream detected as having no language tagged, tagging as ${inputs.tag_language}. \n`;
            convert = true;
          }
        }
      }

      // Check if stream type is subtitle and increment subtitleIdx if true.
      if (forcedexists === true && subtitleIdx > 1) {
        removesub = true;
      } else if (forcedexists === false && subtitleIdx > 0 && file.ffProbeData.streams[i].tags.title !== inputs.title_language) {
        removesub = true;
      }
      if (removesub === true) {
        extraArguments += `-map -0:s:${subtitleIdx} `;
        convert = true;
      }
      subtitleIdx++;
    }
  }

  if (convert === true) {
    response.processFile = true;
    response.reQueueAfter = true;
    response.preset = `,-map 0 ${extraArguments} -c copy -max_muxing_queue_size 9999`;
    response.infoLog += "☒File has bad subs, removing and tagging. \n";
  } else {
    response.processFile = false;
    response.infoLog += "☑File doesn't contain subtitle tracks which are unwanted or that require tagging. \n";
  }
  return response;
}

module.exports.details = details;
module.exports.plugin = plugin;
