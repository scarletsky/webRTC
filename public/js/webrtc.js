'use strict';

//Adapter browser
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL;
var RTCPeerConnection = RTCPeerConnection;
var RTCSessionDescription = RTCSessionDescription;
var RTCIceCandidate = RTCIceCandidate;


var name = 'visitor ' + Math.floor(Math.random() * 100);
var started = false;
var requestSocketId;
var initiator = false;

var localStream;
var remoteStream;
var pc;
var pcConfig = {
    'iceServers': [{
        'url': 'stun:stun.l.google.com:19302'
    }]
};
var pcConstraints = {
    'optional': [{
        'DtlsSrtpKeyAgreement': true
    }]
};
var sdpConstraints = {};

var userListDiv = document.getElementById('div-users');
var localVideo = document.getElementById('localVideo');
var remoteVideo = document.getElementById('remoteVideo');

var socket = io.connect(location.origin);

if (!navigator.getUserMedia) {
    alert('Native device media streaming (getUserMedia) not supported in this browser.');
} else {
    console.log('Let\'s go to play webRTC~');
}

if(navigator.mozGetUserMedia){
    pcConfig = {
        'iceServers': [{
            'url': 'stun:23.21.150.121'
        }]
    };
    RTCPeerConnection = mozRTCPeerConnection;
    RTCSessionDescription = mozRTCSessionDescription;
    RTCIceCandidate = mozRTCIceCandidate;

}else if(navigator.webkitGetUserMedia){
    RTCPeerConnection = webkitRTCPeerConnection;
}

if(!name){
    alert('no name');
}

socket.emit('online', name);

socket.on('online', function(data){
    console.log('====   online: ', data);
    flushUserList(userListDiv, JSON.parse(data));
});
socket.on('offline', function(data){
    console.log('====   offline: ', data);
    flushUserList(userListDiv, JSON.parse(data));
});
// get user media
socket.on('chat request', function(data) {
    console.log('====   chat request: ', data.id);
    var ok = confirm('Whether to accept ' + data.name + ' video chat request ?');
    if(ok){
        requestSocketId = data.id;
        getUserMedia();
    }
});
// create offer
socket.on('stream ok', function(id){
    requestSocketId = id;
    if(initiator){
        getUserMedia();
    }else{
        createPeerConnection();
        pc.createOffer(
            function setLocalAndSendOffer(sessionDescription) {
                pc.setLocalDescription(sessionDescription, function () {
                    socket.emit('offer', requestSocketId, sessionDescription);
                }, onError);
            },
            onError,
            sdpConstraints
        );
    }
});
// get offer
socket.on('offer', function(id, data){
    requestSocketId = id;
    createPeerConnection();
    pc.setRemoteDescription(new RTCSessionDescription(data), function () {
        pc.createAnswer(function setLocalAndSendAnswer(sessionDescription){
            pc.setLocalDescription(sessionDescription, function () {
                socket.emit('answer', requestSocketId, sessionDescription); 
            }, onError);
        }, onError, sdpConstraints);
    });
});
// get answer
socket.on('answer', function(id, data){
    requestSocketId = id;
    pc.setRemoteDescription(new RTCSessionDescription(data), function () {
        socket.emit('ping', id);
    });
});
// add ice candidate
socket.on('candidate', function(data){
    var candidate = new RTCIceCandidate({
        sdpMLineIndex: data.label,
        candidate: data.candidate
    });
    pc.addIceCandidate(candidate);
});
// ping
socket.on('ping', function (id) {
    console.log('==== ping', id);
});


function attachMediaStream(video, stream){
    if(video.mozSrcObject !== undefined){
        video.mozSrcObject = stream;
    }else{
        video.src = (window.URL && window.URL.createObjectURL(stream)) || stream;
    }
    video.play();
}

function trim(str){
    return str.replace(/^\s+|\s+$/g,'');
}

function flushUserList(elem, data){
    elem.innerHTML = '';
    for(var i=0;i<data.length;i++){
        var label = document.createElement('label');
        var text = document.createTextNode(data[i].name);
        label.appendChild(text);
        label.setAttribute('id', data[i].id);
        label.onclick = function(e){
            var socketId = e.target.getAttribute('id');
            // console.log(socket.socket.sessionid);
            // getUserMedia();
            initiator = true;
            socket.emit('chat request', {
                id: socketId,
                name: name
            });
        };
        elem.appendChild(label);
    }
}

// video scale  4:3
function getUserMedia() {
    started = true;
    navigator.getUserMedia({
        video: {
            mandatory: {
                minWidth: 480,
                minHeight: 360
            }
        },
        audio: false
    }, function successCallback(stream) {
        localStream = stream;
        attachMediaStream(localVideo, localStream);
        socket.emit('stream ok', requestSocketId);
    }, onError);
}

function createPeerConnection() {
    try {
        pc = new RTCPeerConnection(pcConfig, pcConstraints);

        pc.addStream(localStream);

        pc.onicecandidate = function handleIceCandidate(event) {
            // console.log('====   onicecandidate event: ', event);
            if (event.candidate) {
                socket.emit('candidate', requestSocketId, {
                    type: 'candidate',
                    label: event.candidate.sdpMLineIndex,
                    id: event.candidate.sdpMid,
                    candidate: event.candidate.candidate
                });
            } else {
                console.log('End of candidates.');
            }
        };
    } catch (e) {
        alert('==== createPeerConnection error:');
        console.log(e);
        return;
    }

    pc.onaddstream = function handleRemoteStreamAdded(event) {
        console.log('====   onaddstream event: ', event);
        attachMediaStream(remoteVideo, event.stream);
        remoteStream = event.stream;
    };

    pc.onremovestream = onError;
}

function onError(e) {
    console.log('onError : ', e);
}
