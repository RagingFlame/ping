
var request = require('request'),
    httpStatusMsg = require('./http-status'),
    mailer = require('./mailer');;




function Ping (opts) {
    this.website = '';
    this.timeout = 15;
    this.handle = null;
    this.time = 0;
    this.refresh = 3600000;
    this.repeat = true;
    
    this.init(opts);
}


function getFormatedDate(time) {
    var currentDate = new Date(time);
  
    currentDate = currentDate.toISOString()
    currentDate = currentDate.replace(/T/, ' ');
    currentDate = currentDate.replace(/\..+/, ''); 

    return currentDate;
}




Ping.prototype = {

    init: function (opts) {
        var self = this;
        
        self.website = opts.website;
        
        self.timeout = (opts.timeout * (60 * 1000));
        
        if (opts.hasOwnProperty('repeat')) {
            self.ping();
        }
        else {
            self.start();  
        }
    },

    
    
    
    ping: function () {
        var self = this, currentTime = Date.now();
        
        function handleResponse (error, res, body) {
            if (!error && res.statusCode === 200) {
                self.isOk();
            }
            else if (!error) {
                self.isNotOk(res.statusCode);   
            }
            else {
                self.isNotOk();
            }
        }
        
        if ((currentTime - self.time) >= self.refresh) {
            self.stop();
            
            return self.start();
        }
        
        process.nextTick(function () {
            try {
                request(self.website, handleResponse);
            }
            catch (err) {
                self.isNotOk();
            }
        });
    },
    
    
    

    isOk: function () {
        var time =  Date.now();
        
        console.log('Time: ' + getFormatedDate(time));
        console.log('Website: ' + this.website);
        console.log('Status: UP');
        console.log('Message: OK');
        console.log(' ');
    },

    
    

    isNotOk: function (statusCode) {
        var time =  Date.now(), 
            self = this,
            ftime = getFormatedDate(time),
            msg = (httpStatusMsg(statusCode) || 'Null'),
            htmlMsg = '<p>Time: ' + ftime;
            htmlMsg +='</p><p>Website: ' + self.website;
            htmlMsg += '</p><p>Message: ' + msg + '</p>';
        
        console.log('Time: ' + ftime);
        console.log('Website: ' + self.website);
        console.log('Status: DOWN');
        console.log('Message: ' + msg);
        console.log(' ');
        
        mailer({
            from: 'uptime-robot@rflab.co.za',
            to: 'qawemlilo@gmail.com',
            subject: self.website + ' is down',
            body: htmlMsg
        }, function (error, res) {
            if (error) {
                console.log(error);
            }
            else {
                console.log(res.message || 'Failed to send email');
            }   
        })
    },
    
    
    
    
    start: function () {
        var self = this;
        
        self.time = Date.now();
        
        console.log('Time: ' + getFormatedDate(self.time));
        console.log('Pinging: ' + self.website);
        console.log('==========================================================>>');
        console.log(' ');
        
        self.handle = setInterval(function () {
            self.ping();
        }, self.timeout); 
    },
    
    
    

    stop: function () {
        clearInterval(this.handle);  
    }    
};

module.exports = Ping;
