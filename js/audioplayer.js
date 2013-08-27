
var BINAURAL_IRS = [
  './binaural/s1_r1_b.wav',
  './binaural/s1_r2_b.wav',
  './binaural/s1_r3_b.wav',
  './binaural/s1_r4_b.wav',
  './binaural/s2_r1_b.wav',
  './binaural/s2_r2_b.wav',
  './binaural/s2_r3_b.wav',
  './binaural/s2_r4_b.wav',
  './binaural/s3_r1_b.wav',
  './binaural/s3_r2_b.wav',
  './binaural/s3_r3_b.wav',
  './binaural/s3_r4_b.wav',
];

function onSongSelected(fileList) {
  var audioElement = document.getElementById('audioctrl');
  var targetFile = fileList[0];
  
  // これまで再生していたものを破棄
  audioElement.removeAttribute('src');
  audioElement.load();
  
  // 次に再生するデータをセット
  var url = URL.createObjectURL(targetFile);  
  audioElement.src = url;
  audioElement.load();
  
  audioElement.onloadeddata = function(evt) {
    // https://developer.mozilla.org/ja/docs/Web/API/window.URL.revokeObjectURL
    // window.URL.createObjectURL() を用いてオブジェクト URL を生成した後、
    // ブラウザがファイルへの参照を維持する必要が無くなった際にこのメソッドを呼び出します。
    URL.revokeObjectURL(url);
  };
  
  audioElement.onerror = function(evt) {
    window.alert('This file cannot be handled.');
  };
  
}

function onFilterChanged(selectObj) {
  switchEqualizer(selectObj.selectedIndex - 1);
}

function onBinauralSourceChanged(selectObj) {
  switchBinauralSource(selectObj.selectedIndex - 1);
}

var audioContext;
var sourceNode;
var filter;
var convolver;
var binauralIRBuffer;

function switchEqualizer(filterType) {
  if (-1 === filterType) {
    filter = null;
  } else {
    if (!filter) {
      filter = audioContext.createBiquadFilter();
    }
    filter.type = filterType;
  }
  setupAudioPass();
}

function switchBinauralSource(sourceIndex) {
  if (0 > sourceIndex) {
    convolver = null;
    setupAudioPass();
  } else {
    var req = new XMLHttpRequest();
    req.open("GET", BINAURAL_IRS[sourceIndex], true);
    req.responseType = "arraybuffer";
    req.onload = function() {
      binauralIRBuffer = audioContext.createBuffer(req.response, false);
      if (!convolver) {
        convolver = audioContext.createConvolver();
      }
      convolver.buffer = binauralIRBuffer;
      setupAudioPass();
    };
    req.send();
  }
}

function setupAudioPass() {

  // 音源に対し、順番にNodeを繋いでいく
  var mediaElement = document.getElementById('audioctrl');
  if (!sourceNode) {
    sourceNode = audioContext.createMediaElementSource(mediaElement);
  } else {
    sourceNode.disconnect();
  }
  
  var tailNode = sourceNode;
  
  if (filter) {
    sourceNode.connect(filter);
    tailNode = filter;
  }
  
  if (convolver) {
    tailNode.connect(convolver);
    tailNode = convolver;
  }

  // 最後のNodeはdestinationへつなぐ
  tailNode.connect(audioContext.destination);
}

if (!window.URL.createObjectURL) {
  window.alert('This browser doesn\'t have enough capability to use this app (createObjectURL)');
}

if(typeof(webkitAudioContext)!=="undefined") {
  audioContext = new webkitAudioContext();
} else if(typeof(AudioContext)!=="undefined") {
  audioContext = new AudioContext();
} else {
  window.alert('This browser doesn\'t have enough capability to use this app (WebAudio)');
}

