const { open } = require('fs/promises');
const xml2json = require('xml2json');
const fs = require('fs');
const glob = require('fast-glob');

const svg_path = './node_modules/@fortawesome/fontawesome-free/svgs/solid/';

const icons = glob([svg_path + '*'])
    .then(files => files.map(
        file => file.substr(svg_path.length).replace(/\.svg/, '')
    ));

const dictionary = new Promise(
        (resolve, reject) => fs.readFile('./en-es.xml', (err, data) => {
            err && reject(err);
            resolve(data);
        })
    )
    .then(data => {
        const json = xml2json.toJson(data, {object: true});
        /**
         * This is now in a JS object:
         *
         * <dic ...>
         *     <l>
         *         ... here are the a's
         *     </l>
         *     <l>
         *         ... here are the b's
         *     </l>
         *     ...
         * </dic>
         *
         * like this:
         *
         * {
         *     dic: {
         *         l: [
         *             ... here are the A's
         *             ... here are the B's
         *         ]
         *     }
         * }
         */
        return json.dic.l;
    })
    .then(letter_groups => {
        /**
         * Now we have a length=26 array like this:
         * [
         *     {w: [... entries for A]},
         *     {w: [... entries for B]},
         *     ...
         * ]
         *
         * Let's flatten to this;
         *
         * [
         *     first entry for A
         *     second entry for A
         *     ...
         *     first entry for B
         *     second entry for B
         *     ...
         * ]
         */
        return letter_groups.flatMap(letter_group => {
            return letter_group.w;
        });
    })
    .then(entries => {
        /**
         * Now we have all the entries like this:
         *
         * [
         *     {
         *         c: 'first A word',
         *         d: 'spanish versions, comma separated',
         *         ...
         *     },
         *     {
         *         c: 'second A word',
         *         d: 'spanish versions, comma separated',
         *         ...
         *     },
         *     ...
         * ]
         *
         * Let's turn it into this:
         *
         * {
         *   'first A word': ['spanish version', 'spanish version'],
         *   'second A word': ['spanish version', 'spanish version'],
         *   ...
         * }
         */
        return entries.reduce((dictionary, entry) => {
            if (typeof entry.d !== 'string') {
                return dictionary;
            }
            const valid = /^[a-z0-9àáâäæãåāèéêëēėęîïíīįìôöòóœøōõûüùúūñçčğ%ºªþșł&+\s\-\.\/'´]+$/i;
            const spanish = entry.d
                .replace(/\{[mfpns]\}/g, '')
                .replace(/[!¡¿?]/g, '')
                .replace(/\(.*\)/g, '')
                .replace(/\[.*\]/g, '')
                .replace(/\".*\"/g, '')
                .replace(/^.*\:.*$/g, '')
                .replace(/^.*\◌.*$/g, '')
                .replace(/-́/g, '-')
                .replace(/\u00a0/g, ' ')
                .replace(/\u200e/g, '') // what even is this zero-length thing?
                .split(/[,;]/)
                .map(word => word.trim())
                .filter(Boolean)
                .filter(word => {
                    if (! valid.test(word)) {
                        throw new Error(`Bad word: <${word}>, <${entry.d}>, <${entry.c}>, ${[...word].map(char => char.charCodeAt(0).toString(16))}`);
                    }
                    return true;
                });
            dictionary[entry.c] = (dictionary[entry.c] || []).concat(spanish);
            return dictionary;
        }, {});
    });

const extraDictionary = {
    'air freshener': ['ambientador'],
    'allergies': ['alergias'],
    'alt': ['alt', 'alternativo'],
    'american': ['americano'],
    'assistive': ['asistencial'],
    'backspace': ['retroceso', 'borrar'],
    'backward': ['atrás'],
    'bahai': ['bahai'],
    'bezier': ['bezier'],
    'bible': ['Biblia'],
    'biking': ['bicicleta'],
    'box': ['caja'],
    'bullhorn': ['megáfono'],
    'campground': ['camping'],
    'capsule': ['cápsula'],
    'caret': ['intercalación', 'intercalar'],
    'chart': ['gráfico'],
    'chevron': ['cheurón'],
    'combined': ['combinado'],
    'crescent': ['creciente'],
    'crossbones': ['calavera'],
    'crosshairs': ['punto de mira'],
    'dharmachakra': ['dharmachakra', 'dharma', 'chakra'],
    'dna': ['adn'],
    'dolly': ['carro', 'muñequita', 'rodante'],
    'dropper': ['gotas'],
    'dumpster': ['contenedor de basura', 'basura'],
    'eject': ['Botón de expulsión', 'expulsar'],
    'europe': ['europa'],
    'exclamation': ['punto de exclamación', 'exclamación'],
    'eye dropper': ['cuentagotas'],
    'faucet': ['grifo'],
    'flatbed': ['plataforma'],
    'flushed': ['sonrojada'],
    'font': ['fuente'],
    'freshener': ['ambientador'],
    'gamepad': ['controlador'],
    'genderless': ['sin género'],
    'greater': ['mayor que', 'mas que'],
    'hamsa': ['hamsa'],
    'hanukiah': ['hanukiah'],
    'hashtag': ['hashtag'],
    'hdd': ['disco duro'],
    'headset': ['auriculares', 'audifonos'],
    'hippo': ['hipopótamo', 'hipo'],
    'hockey': ['hockey'],
    'hot tub': ['Bañera de hidromasaje', 'jacuzi'],
    'hotdog': ['salchicha', 'hot dog'],
    'id': ['identification', 'carnet'],
    'inbox': ['bandeja de entrada'],
    'indent': ['sangrar', 'sangría de párrafo '],
    'info': ['informacion'],
    'injured': ['herida'],
    'interpret': ['interpret'],
    'lightbulb': ['foco'],
    'marked': ['marcado'],
    'marker': ['marcador'],
    'maximize': ['maximizar'],
    'medical': ['médica'],
    'medkit': ['Botiquín'],
    'microchip': ['pastilla'],
    'numeric': ['numerico'],
    'outdent': ['desangrada', 'sangrada'],
    'paperclip': ['clip de papel', 'clip', 'gancho'],
    'pastafarianism': ['pastafarianismo'],
    'pen nib': ['plumilla'],
    'pickup': ['camión'],
    'piggy bank': ['hucha'],
    'piggy': ['chancho', 'puerco'],
    'powerpoint': ['powerpoint'],
    'qrcode': ['código qr'],
    'quran': ['córan'],
    'radiation': ['radiación'],
    'raised': ['levantado'],
    'republican': ['republicano'],
    'retro': ['retro', 'viejo'],
    'retweet': ['retuitear'],
    'sd card': ['tarjeta sd', 'flash'],
    'shekel': ['siclo'],
    'shipping': ['Envío'],
    'shopping': ['compras'],
    'shuttle van': ['furgoneta lanzadera'],
    'sim card': ['chip', 'sim card'],
    'sitemap': ['mapa del sitio'],
    'skull crossbones': ['calavera'],
    'sliders': ['deslizadores'],
    'spinner': ['hilandera'],
    'splotch': ['mancha'],
    'spock': ['spock'],
    'stamp': ['sello'],
    'steelpan': ['sartén de acero', 'acero'],
    'strikethrough': ['tachada'],
    'subscript': ['subíndice'],
    'superscript': ['sobrescrita'],
    'swatchbook': ['muestrario', 'libro de muestras'],
    'sync': ['sincronizar'],
    'tachograph': ['tacógrafo'],
    'tachometer': ['tachometer', 'metro'],
    'teeth': ['dientes'],
    'th': ['ventana'],
    'torah': ['tora'],
    'tshirt': ['camiseta'],
    'tub': ['tina'],
    'tv': ['tele', 'televisor', 'televisión'],
    'ungroup': ['grupo'],
    'unlink': ['desconectar', 'desactivar'],
    'usa': ['usa', 'eeuu'],
    'usd': ['usd'],
    'utensil': ['utensilio'],
    'van': ['furgoneta'],
    'vial': ['frasca'],
    'vinyl': ['vinilo'],
    'voicemail': ['mensaje de voz', 'audio'],
    'vr': ['realidad virtual'],
    'wired':  ['cableado'],
    'won': ['ganar'],
    'yea': ['sí'],
};

const ignore = [
    "africa",
    "americas",
    "asia",
    "csv",
    "david",
    "ethernet",
    "futbol",
    "gopuram",
    "jedi",
    "kaaba",
    "khanda",
    "lira",
    "martini",
    "md",
    "nib",
    "ninja",
    "ol",
    "om",
    "pdf",
    "quidditch",
    "rss",
    "sd",
    "sim",
    "sms",
    "stroopwafel",
    "tenge",
    "terminal",
    "torii",
    "tty",
    "ul",
    "venus",
    "vihara",
    "whills",
    "wifi",
    "yang",
    "yin",
];

Promise.all([
        icons,
        dictionary,
    ])
    .then(([icons, dictionary]) => {
        dictionary = {...dictionary, ...extraDictionary};
        return icons.reduce((search, icon) => {
            const terms = icon
                .split(/\-/)
                .concat(icon.replace(/\-/, ' '));

            terms.forEach(english => {
                english = substitute(english, dictionary);
                if (
                    !/\s/.test(english)
                    && !dictionary[english]
                    && english.length > 1
                    && !/\d/.test(english)
                    && !ignore.includes(english)
                ) {
                    throw new Error(`No translation for ${english} in ${icon}`);
                }
                if (dictionary[english]) {
                    dictionary[english].forEach(spanish => {
                        search[spanish] = (search[spanish] || []).concat(icon);
                    });
                }
            });

            return search;
        }, {});
    })
    .then((spanish_map) => {
        return new Promise((resolve, reject) => {
            fs.writeFile(
                './spanish_map.json',
                JSON.stringify(spanish_map, null, 0),
                (err, result) => { err && reject(err) || resolve(result) }
            );
        });
    })
    .then(() => console.log('Done writing'));

function substitute(english, dictionary) {
    if (dictionary[english]) {
        return english
    }
    if (/ing$/.test(english)) {
        const noing = english.replace(/ing$/, '');
        if (dictionary[noing]) {
            return noing;
        }
    }
    if (/ing$/.test(english)) {
        const ing2e = english.replace(/ing$/, 'e');
        if (dictionary[ing2e]) {
            return ing2e;
        }
    }
    if (/s$/.test(english)) {
        const nos = english.replace(/s$/, '');
        if (dictionary[nos]) {
            return nos;
        }
    }
    if (/es$/.test(english)) {
        const noes = english.replace(/es$/, '');
        if (dictionary[noes]) {
            return noes;
        }
    }
    return english;
}
