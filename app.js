const Telegraf = require('telegraf')
const dotenv = require('dotenv');
dotenv.config();
const mysql = require('mysql')
asTable = require('as-table')
const Markup = require("telegraf/markup");
const Stage = require("telegraf/stage");
const session = require("telegraf/session");
const WizardScene = require("telegraf/scenes/wizard");
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
getLatestData = (sensor_id, callback) => {
    let tamp = [];
    connection.query('select id_sensor as id, value, date  from record where id_sensor = ' + sensor_id + ' order by date desc limit 1', function (error2, result2, fields2) {
        if (error2) throw error2;
        if (result2.length > 0) {
            result2.map((d) => {
                tamp.push({id: d.id, value: d.value, date: strftimeIT('Pukul %H:%M - %A, %d %B %Y', d.date)});
            });
        } else {
            tamp.push({error: "Sensor tidak ditemukan"})
        }

        callback(asTable.configure({maxTotalWidth: 92, delimiter: ' | '})(tamp));
    });
}
getListSensor = (callback) => {
    let tamp = [];
    connection.query('select id_sensor as id, rs.nama as jenis, alamat\n' +
        'from  sensor s\n' +
        'join kandang k on s.id_kandang = k.id_kandang\n' +
        'join device d on s.id_device = d.id_device\n' +
        'join ref_sensor rs on d.id_ref_sensor = rs.id_ref_sensor\n' +
        'where k.deleted_at is null and s.deleted_at is null;', function (error2, result2, fields2) {
        if (error2) throw error2;
        if (result2.length > 0) {
            result2.map((d) => {
                tamp.push(d);
            });
        } else {
            tamp.push({error: "Belum ada sensor"})
        }

        callback(asTable.configure({maxTotalWidth: 192, delimiter: ' | '})(tamp));
    });
}

bot.start(ctx => {
    ctx.reply(
        `Halo ${ctx.from.first_name}, Silahkan Pilih ID Sensor untuk memantau Avesbox`,
        getListSensor(function (msg) {
            ctx.reply(msg);
        })
    );
});

const logSensor = new WizardScene(
    "log_sensor",
    ctx => {
        getLatestData(ctx.message.text, function (msg) {
            ctx.reply(msg);
        });
        return ctx.scene.leave();
    }
);

const stage = new Stage([logSensor], {default: "log_sensor"});
bot.use(session());
bot.use(stage.middleware());

bot.launch();