/*jslint node:true, vars:true, bitwise:true, unparam:true */
/*jshint unused:true */
// Leave the above lines for propper jshinting
//Type Node.js Here :)

var path = require('path');
var mraa = require('mraa');                 // require mraa
var awsIot = require('aws-iot-device-sdk'); // require aws-iot

console.log('MRAA Version: ' + mraa.getVersion()); //write the mraa version to the Intel XDK console

// --------------
var device = awsIot.device({
    keyPath: path.resolve(__dirname, "certs/05461b06b7-private.pem.key"),
   certPath: path.resolve(__dirname, "certs/05461b06b7-certificate.pem.crt"),
     caPath: path.resolve(__dirname, "certs/root-CA.crt"),
   clientId: "edison",
     region: "us-west-2",
     debug: false
 });
 
 //
 // Device is an instance returned by mqtt.Client(), see mqtt.js for full
 // documentation.
 //
 device
   .on('connect', function() {
     console.info('connect');
     console.info('published to AWS IOT');
     });
 
 device
   .on('message', function(topic, payload) {
     console.info('message', topic, payload.toString());
   });

/*
  UVSensor setup
*/
var UVSensor = require('jsupm_guvas12d');

// analog voltage, usually 3.3 or 5.0
var g_GUVAS12D_AREF = 3.3;
var g_SAMPLES_PER_QUERY = 1024;

var grove = require('jsupm_grove');
var jsupm_th02_module = require('jsupm_th02');

var button = new grove.GroveButton(8);
var th02 = new jsupm_th02_module.TH02(1);

// Create the light sensor object using AIO pin 2
var light = new grove.GroveLight(2);

var pastButtonState = 0;
// Initialize on GPIO 3

periodicActivity(); //call the periodicActivity function
fastPeriodActivity();

/*
 * Slow loop - executed every 30s
 */
function periodicActivity()
{
  updateAWS();
  setTimeout(periodicActivity,30000); //call the indicated function after 30 seconds
}

/*
 * Fast loop - executed every 100 ms
 */
function fastPeriodActivity() {
    myBuzzer.stopSound();
    processButtonState();
    processLightSensorState();
    setTimeout(fastPeriodActivity,100); //call the indicated function after 0.1 second (100 milliseconds)  
}

function updateAWS() {
    console.info("Updating AWS");
    var payload = { 
        deviceID: 'maersk',
        data: 
            { 
                button: button.name(), 
                light_value: light.value(),
                temperature: th02.getTemperature(),
                humidity: th02.getHumidity(),
                //uv_value: roundNum(myUVSensor.value(g_GUVAS12D_AREF, g_SAMPLES_PER_QUERY), 9)
            } 
    } 
    device.publish('containers/maersk', JSON.stringify(payload));
}

/*
 * Process the light sensor state
 */
function processLightSensorState() {
    var longMessage = light.name() + "; raw: " + light.raw_value() + ", val: " + light.value();
    console.info(longMessage);
}

/*
 * Handle the button state
 */
function processButtonState() {
    button.value();
}

function roundNum(num, decimalPlaces)
{
	var extraNum = (1 / (Math.pow(10, decimalPlaces) * 1000));
	return (Math.round((num + extraNum) * (Math.pow(10, decimalPlaces))) / Math.pow(10, decimalPlaces));
}
