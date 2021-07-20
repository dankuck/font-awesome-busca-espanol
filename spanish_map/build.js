/**
 * Let's take all the icon names we can find and all the data from an English
 * to Spanish dictionary and produce a file like this:
 *
 * {
 *     "spanish term": ["matching-icon", ...],
 *     ...
 * }
 *
 * It should include all the icons names we found and as many Spanish terms for
 * them that we could find.
 */

const xml2json = require('xml2json');
const fs = require('fs');
const glob = require('fast-glob');

const svg_path = './node_modules/@fortawesome/fontawesome-free/svgs/solid/';

/**
 * Font Awesome helpfully provides each icon as an svg with the same name that
 * is used when developing. So lets just get that list.
 */
const icons = glob([svg_path + '*'])
    .then(files => files.map(
        file => file.substr(svg_path.length).replace(/\.svg/, '')
    ));

/**
 * mananoreboton/en-es-en-Dic is an XML file of English words (apparently
 * nouns-only, but that's fine) and some of their Spanish translations.
 * We can turn it into JS and transform it into an object that supports easy
 * lookup.
 */
const dictionary = new Promise(
        (resolve, reject) => fs.readFile('./spanish_map/en-es.xml', (err, data) => {
            err ? reject(err) : resolve(data);
        })
    )
    .then(data => {
        const json = xml2json.toJson(data, {object: true});
        /**
         * This:
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
         * is now in a JS object like this:
         *
         * {
         *     dic: {
         *         l: [
         *             ... here are the A's
         *             ... here are the B's
         *         ]
         *     }
         * }
         *
         * but we're not done yet...
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
            // Let's remove the extra stuff. The data is not very uniform, but
            // we have found ways to smooth it out:
            const spanish = entry.d
                .replace(/\{[mfpns]\}/g, '')    // {m} and {f} mean gender etc?
                .replace(/[!¡¿?]/g, '')         // Punctuation can go
                .replace(/\(.*\)/g, '')         // (asides) are not needed
                .replace(/\[.*\]/g, '')         // [some other asides] neither
                .replace(/\".*\"/g, '')         // "example text" is no good
                .replace(/^.*\:.*$/g, '')       // If it has a : there's no hope
                .replace(/^.*\◌.*$/g, '')       // This symbol is hopeless too
                .replace(/-́/g, '-')              // This is so unusual my
                                                // monospace is confused
                .replace(/\u00a0/g, ' ')        // The nbsp character
                .replace(/\u200e/g, '')         // what even is this
                                                // zero-length thing?
                .split(/[,;]/)                  // Split the remaining text
                .map(word => word.trim())       // No whitespace
                .filter(Boolean)                // No blanks
                .filter(word => {               // If any still have unusual
                                                // characters, notify the coder
                    if (! valid.test(word)) {
                        throw new Error(`Bad word: <${word}>, <${entry.d}>, <${entry.c}>, ${[...word].map(char => char.charCodeAt(0).toString(16))}`);
                    }
                    return true;
                });
            // The point is to be able to use `dictionary[english_word]` and
            // get an array of useful Spanish words that someone might search,
            // all normalized in a way that we can also normalize the search
            // terms.
            dictionary[entry.c] = (dictionary[entry.c] || []).concat(spanish);
            return dictionary;
        }, {});
    });

/**
 * As we built this script we discovered these words and phrases that were
 * missing from the dictionary.
 */
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

/**
 * As we built this script we discovered these words that have no proper
 * translation. If someone searches for these things they'll use these same
 * terms. So when we build the spanish map, we'll just keep them.
 */
const same = [
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

/**
 * Wait until we have the icons and the dictionary so we can put them together
 */
Promise.all([
        icons,
        dictionary,
    ])
    .then(([icons, dictionary]) => {
        // Add the extra words we defined.
        dictionary = {...dictionary, ...extraDictionary};

        // Go through the list of icons that exist
        return icons.reduce((search, icon) => {
            // Get each word in the icon name, as well as the whole name with
            // spaces instead of -
            const terms = icon
                .split(/\-/)
                .concat(icon.replace(/\-/, ' '));

            // Find the best Spanish for each word in the icon name
            terms.forEach(english => {
                english = substitute(english, dictionary);
                if (
                    !dictionary[english]
                    && !/\s/.test(english)     // Don't require the full term
                                               // to exist
                    && english.length > 1      // Ignore 1-letter words
                    && !/\d/.test(english)     // Ignore numbers
                    && !same.includes(english) // Not a problem
                ) {
                    // Tell the coder that we cannot translate this word
                    // They'll have to add it to the extraDictionary or the
                    // ignore list
                    throw new Error(`No translation for ${english} in ${icon}`);
                }
                if (dictionary[english]) {
                    // Add all the Spanish words as keys and the icon we're
                    // currently working with in a Set as the value
                    dictionary[english].forEach(spanish => {
                        search[spanish] = (search[spanish] || new Set()).add(icon);
                    });
                }
            });

            // Ensure users can search the original term
            search[icon] = (search[icon] || new Set()).add(icon);

            return search;
        }, {});
    })
    .then((spanish_map) => {
        // Convert all the Set values to arrays
        return Object.keys(spanish_map)
            .reduce((map, spanish) => {
                map[spanish] = [...spanish_map[spanish]];
                return map;
            }, {});
    })
    .then((spanish_map) => {
        // Check that all icons are present
        const found = [...new Set(
            Object.values(spanish_map)
            .flat()
        )];
        // Remember `icons` from way up at the top? Ick.
        return icons
            .then(icons => {
                icons = new Set(icons);
                found.forEach(icon => icons.delete(icon));
                if (icons.size) {
                    throw new Error(
                        'Some icons did not receive translations: '
                        + [...icons].join(', ')
                    );
                }
            })
            .then(() => spanish_map);
    })
    .then((spanish_map) => {
        // Write to the file
        return new Promise((resolve, reject) => {
            fs.writeFile(
                './spanish_map/spanish_map.json',
                JSON.stringify(spanish_map, null, 0),
                (err, result) => { err ? reject(err) : resolve(result) }
            );
        });
    })
    .then(() => console.log('Done writing'));

/**
 * If we cannot find a term in the dictionary, we should check if can make
 * it singular or remove -ing and maybe add -e. We'll pick up a few words
 * without having to put them in the extraDictionary.
 *
 * If nothing is found, we return the english string and let the chips fall
 * where they may.
 *
 * @param  string english
 * @param  object dictionary
 * @return string
 */
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
