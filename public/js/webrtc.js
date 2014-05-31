'use strict';

navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL;

if (!navigator.getUserMedia) {
    alert('Native device media streaming (getUserMedia) not supported in this browser.');
} else {
    console.log('Let\'s go to play webRTC~');
}

function attachMediaStream(video, stream){
    if(video.mozSrcObject !== undefined){
        video.mozSrcObject = stream;
    }else{
        video.src = (window.URL && window.URL.createObjectURL(stream)) || stream;
    }
    video.play();
};

function trim(str){
    return str.replace(/^\s+|\s+$/g,'');
};

function flushUserList(elem, data){
    elem.innerHTML = '';
    for(var i=0;i<data.length;i++){
        var label = document.createElement('label');
        var text = document.createTextNode(data[i].name);
        label.appendChild(text);
        label.setAttribute('id', data[i].id);
        label.onclick = function(e){
            // alert('click' + e.target.getAttribute('id'));
            var id = e.target.getAttribute('id');
            // console.log(socket.socket.sessionid);
            socket.emit('request chat', id);
        }
        elem.appendChild(label);
    }
};
// navigator.getUserMedia({
//     video: {
//         mandatory: {
//             minWidth: 640,
//             minHeight: 480
//         }
//     },
//     audio: true
// }, successCallback, errorCallback);

function successCallback(stream) {
    console.log(stream);
    if (video.mozSrcObject !== undefined) {
        video.mozSrcObject = stream;
    } else {
        video.src = (window.URL && window.URL.createObjectURL(stream)) || stream;
    }

    video.play();
}

function errorCallback(err) {
    alert('errorCallback:' + err);
}

//  begin
// var username = trim(prompt('Enter name:'));
var username = 'visitor ' + Math.floor(Math.random() * 10);

var userListDiv = document.getElementById('div-users');

var socket = io.connect(location.origin);

if(!username){
    alert('no name');
}
socket.emit('online', username);


socket.on('online', function(data){
    console.log('====   online');
    console.log(data);
    flushUserList(userListDiv, JSON.parse(data));
});
socket.on('offline', function(data){
    console.log('====   offline');
    console.log(data);
    flushUserList(userListDiv, JSON.parse(data));
});
socket.on('chat', function(data){

});



