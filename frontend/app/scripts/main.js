/**
* INTTRA | AWS DEMO
*      ___ _       _______
*     /   | |     / / ___/
*    / /| | | /| / /\__ \
*   / ___ | |/ |/ /___/ /
*  /_/  |_|__/|__//____/
*
* Constants
* -------------------------------------------------------
*
* Variables
* --------------------------------------------------------
*/

/* CONSTANTS */
// ============ CHANGE THESE VALUES BELOW =============== //

var COGNITO_IDENTITY_POOL = 'us-west-2:ecd391fd-2e25-43aa-b5e9-618cfd291905';
var IOT_REGION = 'us-west-2';
var IOTENDPOINT = 'data.iot.'+IOT_REGION+'.amazonaws.com';
var TOPIC = 'containers';
var MILLIS_PER_PIXEL = 50;
var MAX_VAL_SCALE = 3.0;
var MIN_VAL_SCALE = 3.0;
var LINE_WIDTH = 1;
var MILLIS_PER_LINE = 400;
var VERTICAL_SECTIONS = 6;
var SMOOTHIE_SPEED = 1000;

// =================== REST OF CODE ===================== //

var DEFAULT_COORDINATES = {
  location: [-74.4174, 40.8653],
  zoom: 14
};
var MARKER_GROUP_COLOR = '#422';

/* VARIABLES */
var timestamp = new Date().getTime();
var slideOut = { isOut: false, type: undefined };
var bgcolor = [255,255,255]

$( document ).ready(function() {
  startLoading();
  
 // Configure Cognito identity pool
 AWS.config.region = 'us-west-2';
 var credentials = new AWS.CognitoIdentityCredentials({
     IdentityPoolId: COGNITO_IDENTITY_POOL,
 });
 AWS.config.credentials = credentials;

 // Getting AWS creds from Cognito is async, so we need to drive the rest of the mqtt client initialization in a callback
 credentials.get(function(err) {
     if(err) {
         console.log(err);
         return;
     }
     var requestUrl = SigV4Utils.getSignedUrl('wss', IOTENDPOINT, '/mqtt',
         'iotdevicegateway', IOT_REGION,
         credentials.accessKeyId, credentials.secretAccessKey, credentials.sessionToken);
     initClient(requestUrl);
 });

});
/* EVENT HANDLERS */

mapboxgl.accessToken = "pk.eyJ1IjoiamVyd2FsbGFjZSIsImEiOiIxMjIzOTlmMjYzZGYxNjg5YTEwYWUyYzAwZDAwM2YzZiJ9.ixDFhSmn8fHkc6fExkobzA";
var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v9',
    center: [-74.450395, 40.871331],
    zoom: 7
});

$("#edit-preferences").click(function (){
});

$(".close-box").click(function (){
  closeAll();
});

$("#go").click(function (){
  search();
});

$(".info").click(function (){
  $(".info").fadeOut();
  search();
});

$('input').keypress(function (e) {
  "use strict";
  if (e.which == 13) {
    search();
  }
});


/* FUNCTIONS */

/**
 * This function displays a message on the map.
 * @param {string} type Is the class name to lookup when writing the message.
 * @param {string} title Is the message title.
 * @param {string} message Is the message body.
 * @param {boolean} stick True if you want the message to stick to the screen.
 */
function displayMessage(type, title, message, stick) {
  $("."+type+" .message-title").html(title);
  $("."+type+" .message").html(message);
  $("."+type).fadeIn();
  if (stick!=true) {
    setTimeout(function() {
      $("."+type).fadeOut();
    }, 2000);
  }
}

/**
* This function closes all open slide out windows.
*/
function closeAll() {
  $("#user-settings").animate({right:'-350px'}, {queue: false, duration: 200}).fadeOut();
  $("#user-address").animate({right:'-350px'}, {queue: false, duration: 200}).fadeOut();
  $(".saved").fadeOut();
  slideOut.isOut = false;
}

/**
* This function displays the circular loading animation when running a geospatial search query.
*/
function startLoading() {
  $('#loader').removeClass('done');
  $('#loader').removeClass('hide');
}

/**
* This function hides the circular loading animation when running a geospatial search query has completed.
* @param {string} keywords The keywords to show on the info screen.
*/
function finishedLoading(keywords) {
  $('#loader').addClass('done');
  setTimeout(function() {
    $('#loader').addClass('hide');
  }, 500);
  displayMessage("saved","Search completed", " for \"<strong>"+keywords+"</strong>\".", false);
}

/**
 * Refresh the map pins based on a search query
 * @param {string} q The keyword search query to perform.
 */
function refreshMap(q) {

}

// Connect the client, subscribe to the drawing topic, and publish a "hey I connected" message
function initClient(requestUrl) {
  var clientId = String(Math.random()).replace('.', '');
  var client = new Paho.MQTT.Client(requestUrl, clientId);
  var connectOptions = {
      onSuccess: function () {
          console.log('connected');
          displayMessage('saved', 'Connected!', 'Successfully connected to AWS IoT.', false)
          client.subscribe('containers/#');
      },
      useSSL: true,
      timeout: 16,
      mqttVersion: 4,
      onFailure: function () {
          console.error('connect failed');
      }
  };

  client.onMessageArrived = function (message) {
     console.log(message.payloadString);
     var record = JSON.parse(message.payloadString);
     if (record.deviceId===undefined) {
       console.log('Record format incorrect, or missing Container ID.');
     } else {
      
       var change = false;

       if (record.data['3axis']['y']>0.7) {
         bgcolor = [170,1,20]
         displayMessage('failed', 'Container '+record.deviceId+' Alert!', 'Catastrophic angle detected.', false)
         $("#"+record.deviceId).css('color','white')
         change = true;
       } else {
         $("#"+record.deviceId).css('color','black')
         bgcolor = [255,255,255]
       }

      if (record.data['button']>=1) {
         displayMessage('info', 'Container manifest updated.', 'A change has been made to the contents of the container.', false)
      }

      if (record.data['light']>=420) {
        bgcolor = [50,205,50]
        displayMessage('info', 'Container '+record.deviceId+' has been opened.', 'The container is currently open.', false)
      } else if (change==false) {
        bgcolor = [255,255,255]
      }

       $("#"+record.deviceId).css('background-color',colorToStyle(bgcolor, 0.4))
       $("#"+record.deviceId).html('<div class="logo"><img src="images/'+record.deviceId+'-logo.jpg"></div>'+
       '<div class="temp"><span class="caps-titles">TEMP</span>'+record.data.temp+'°C</div>'+
       '<div class="humidity"><span class="caps-titles">HUMIDITY</span>'+record.data.humidity+'%</div>')
     }
  };

  client.onConnectionLost = function (message) {
      displayMessage('failed', 'Disconnected.', 'Lost the connection to AWS IoT.', false)
      console.log('connection lost!');
      console.log(message);
  };

  client.connect(connectOptions);
}

map.on('load', function () {
        map.addLayer({
            "id": "points",
            "type": "symbol",
            "source": {
                "type": "geojson",
                "data": {
                    "type": "FeatureCollection",
                    "features": [{
                        "type": "Feature",
                        "geometry": {
                            "type": "Point",
                            "coordinates": [-74.450395, 40.871331]
                        },
                        "properties": {
                            "title": "Estelle Maersk",
                            "icon": "ferry"
                        }
                    }]
                }
            },
            "layout": {
                "icon-image": "{icon}-15",
                "text-field": "{title}",
                "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
                "text-offset": [0, 0.6],
                "text-anchor": "top"
            }
        });
        finishedLoading('');
    });

/**
* This function runs the search via refreshMap.
*/
function search() {
  refreshMap($("#q").val());
}

function colorToStyle(color, alpha) {
  return 'rgba(' + color[0] + ',' + color[1] + ',' + color[2] + ','+alpha+')';
}

/* OPERATIONS ON PAGE LOAD */

$(function() {
  //axes = createTimeSeriesGraph('axes');
  // axes.addTimeSeries(, { strokeStyle: colorToStyle([122,232,232], 1), fillStyle: colorToStyle([122,232,232], 0), lineWidth: 3 });
  // Getting AWS creds from Cognito is async, so we need to drive the rest of the mqtt client initialization in a callback

  // Get the default user.
  refreshMap();
});
