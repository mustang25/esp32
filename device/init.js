load('api_uart.js');
load('api_sys.js');
load('api_aws.js');
load('api_timer.js');

// UART Number to use with GPS Sensor.
let uartNo = 1;

// Object to send to AWS IoT device shadow. 
let state = {gps: null, temperature: null, humidity: null};

// Optional Digital Humidity Sensor Pro (DHT22) at GPIO22
/*
load('api_dht.js');
let DHTpin = 22;
let dht = DHT.create(DHTpin, DHT.DHT22);
*/

// Connect the GPS sensor (TX wire -> RX GPIO16, RX wire -> TX GPIO17)
UART.setConfig(uartNo, {
  baudRate: 9600,
  esp32: {
    gpio: {
      rx: 16,
      tx: 17,
    },
  },
});

// Dispatcher to update GPS data. 
UART.setDispatcher(uartNo, function(uartNo) {
  let ra = UART.readAvail(uartNo);
  if (ra > 0) {
    state.gps = UART.read(uartNo);
  }
}, null);

UART.setRxEnabled(uartNo, true);

Timer.set(5000, Timer.REPEAT, function() {
  //state.temperature = dht.getTemp();
  //state.humidity = dht.getHumidity();
  AWS.Shadow.update(0, state);
}, null);
