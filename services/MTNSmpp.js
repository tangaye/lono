const smpp = require("smpp");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

class MTNSmpp {

    session = null;

    constructor()
    {

        this.session = smpp.connect({
            url: process.env.MTN_SMPP_URL,
            auto_enquire_link_period: 60000, // every 60 sec
            debug: true
        }, () => {

        });

        this.session.on('connect',  () => {

            console.log('[SMPP client connected]');

            this.session.bind_transceiver({
                system_id: process.env.MTN_SMPP_SYSTEM_ID,
                password: process.env.MTN_SMPP_PASSWORD
            }, function(pdu) {
                if (pdu.command_status === 0) {
                    this.connected = true;
                    console.log('[SMPP client bound successfully!]');
                } else {
                    console.error('[SMPP client failed to bind]:', pdu);
                    this.connected = false;
                    this.session.close();
                }
            });
        });


        // Handle incoming SMPP messages received from the SMPP server
        this.session.on('deliver_sm', (pdu) => {
            // Handle the incoming SMPP message as required
            const sourceAddress = pdu.source_addr;
            const destinationAddress = pdu.destination_addr;
            const message = pdu.short_message.message;

            console.log('Received SMPP message:', message);

            // Reply to SMSC that we received and processed the SMS
            this.session.deliver_sm_resp({ sequence_number: pdu.sequence_number });
        });

        // To enable a simple debug of ingoing/outgoing messages pass debug: true as server/client option. Debug is disabled by default.
        this.session.on('debug', function(type, msg, payload) {
            console.log('[logging debug]: ', {type: type, msg: msg, payload: payload});
        });

        // for every enquire link request, send a response
        this.session.on('enquire_link', (pdu) => {
            console.info('[ENQUIRE LINK - RESPONSE]');
            this.session.send(pdu.response())
        });


        // In case of errors while trying to connect, an error event will be emitted by the session and the program will be terminated if it's not listened. This is how you should check for errors.
        this.session.on('error', function(e) {

            // empty callback to catch emitted errors to prevent exit due unhandled errors
            if (e.code === "ETIMEOUT") {
                // TIMEOUT
                console.log("timed out")
            } else if (e.code === "ECONNREFUSED") {
                // CONNECTION REFUSED
                console.log("ECONNREFUSED")
            } else {
                // OTHER ERROR
                console.log("other error", e)
            }
        });


    }

    sendSMS (from, to, message) {


        this.session.submit_sm({
            destination_addr: to, // destination_phone_number
            short_message: message,
            source_addr: to,
            source_addr_ton: 5, // Type of number of the source address
            dest_addr_ton: 1, // Type of number of the destination phone number
            dest_addr_npi: 1, // 0 = Unknown, 1 = ISDN, 3 = Data, 4 = Telex, 5 = SMS, 6 = Radio, 7 = Fax, 8 = Videotelephony
        }, function(pdu) {

            if (pdu.command_status === 0) {
                // Message successfully sent
                console.log("[MESSAGE SENT SUCCESSFULLY]")
                console.log(pdu.message_id);
            } else{
                console.log('[MESSAGE NOT SENT]: ', pdu)
            }

        });
    }

}

const mtn = new MTNSmpp();

setTimeout(() => mtn.sendSMS("Lono", "231778415037", "Hello"), 3000)

