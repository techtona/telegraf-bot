const Telegraf = require('telegraf')
const dotenv = require('dotenv');
const mysql = require('mysql')
asTable = require('as-table')
dotenv.config();
let connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    timezone: process.env.DB_TIMEZONE
});
const bot = new Telegraf(process.env.BOT_TOKEN)
bot.use(async (ctx, next) => {
    const start = new Date()
    await next()
    const ms = new Date() - start
    console.log('Response time: %sms', ms)
})

var strftime = require('strftime') // not required in browsers
var id_ID = {
    days: ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'],
    shortDays: ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'],
    months: ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus',
        'September', 'Oktober', 'November', 'Desember'],
    shortMonths: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
    AM: 'AM',
    PM: 'PM',
    am: 'am',
    pm: 'pm',
    formats: {
        D: '%m/%d/%y',
        F: '%Y-%m-%d',
        R: '%H:%M',
        X: '%T',
        c: '%a %b %d %X %Y',
        r: '%I:%M:%S %p',
        T: '%H:%M:%S',
        v: '%e-%b-%Y',
        x: '%D'
    }
}
var strftimeIT = strftime.localize(id_ID);

function getLatestData(sensor_id, callback){
    let tamp = [];
    connection.query('select id_sensor as id, value, date  from record where id_sensor = '+sensor_id+' order by date desc limit 1', function (error2, result2, fields2) {
        if (error2) throw error2;
        result2.map((d) => {
            tamp.push({id : d.id, value : d.value, date : strftimeIT('Pukul %H:%M - %A, %d %B %Y',d.date)});
        });
        callback(asTable.configure ({ maxTotalWidth: 92, delimiter: ' | ' })(tamp));
    });
}
bot.help(function (ctx) {
    getLatestData(6, function (msg) {
        ctx.reply(msg);
    });
});
bot.hears('hi', (ctx) => ctx.reply('Hey there'))
bot.launch()