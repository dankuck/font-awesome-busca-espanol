<template>
    <div>
        <div class="input-group input-group-lg mb-3">
            <input
                v-model.trim="query"
                type="text"
                class="form-control"
                placeholder="Buscar iconos"
                aria-label="Buscar"
                aria-describedby="botón"
                @keyup.enter="search"
            />

            <button
                class="btn btn-outline-secondary"
                @click="search"
            >
                <i class="fas fa-search"></i>
            </button>
        </div>
        <div class="row">
            <div class="col-6 col-md-3 col-xl-2 mb-5"
                v-for="icon in iconsWithoutAd"
                :key="icon"
            >
                <a
                    :href="`https://fontawesome.com/v5.9/icons/${icon}`"
                    class="icon"
                    target="_blank"
                >
                    <i
                        class="fas"
                        :class="`fa-${icon}`"
                    ></i>
                    <div>
                        {{ icon }}
                    </div>
                    <pre v-if="debug">
                        {{ matches[icon] }}
                    </pre>
                </a>
            </div>
            <div v-if="iconsWithoutAd.length === 0" class="col text-center fs-1">
                No hay resultados.
            </div>
        </div>
    </div>
</template>

<script>
import spanishMap from '../spanish_map/spanish_map.json';

export default {
    data() {
        const url = new URL(location);
        return {
            query: '',
            debug: url.searchParams.get('debug') || false,
        };
    },
    computed: {
        icons() {
            if (! this.query) {
                return this.allIcons;
            } else {
                return this.queryResults.icons;
            }
        },
        matches() {
            return this.queryResults.matches;
        },
        queryResults() {
            if (!this.query) {
                return {icons: this.allIcons, matches: {}};
            } else {
                return this.search(this.query);
            }
        },
        iconsWithoutAd() {
            // ad blockers block 'ad' and make this one ugly
            return this.icons.filter(icon => icon != 'ad');
        },
        allIcons() {
            return [...new Set(Object.values(spanishMap).flat(1))]
                .sort((a, b) => a.localeCompare(b));
        },
    },
    methods: {
        /**
         * Search the icons in Spanish and English. Sort by number of matching
         * terms from the search query
         *
         * @param  string query
         * @return Object {
         *                 icons: array<string>,
         *                 matches: {
         *                     icon: {
         *                         terms: array<string>,
         *                         matches: [
         *                             {
         *                                 term: string,
         *                                 found: string
         *                             }
         *                         ]
         *                     }
         *                }
         */
        search(query) {
            // We'll search for each word separately
            const queryWords = query.toLowerCase().split(/\s+/);
            const matchers = queryWords.map(
                term => ({term, matcher: this.makeRegExp(term)})
            );

            // Run through all the search terms and get this:
            // [
            //  {
            //      term: string,
            //      icons: [
            //          {icon: string, found: string},
            //      ]
            //  }
            // ]
            const matches = matchers.map(({term, matcher}) => {
                // Find the matching Spanish words
                const spanish_matches = Object.keys(spanishMap)
                    .filter(term => matcher.test(term))
                // Get the icons from the Spanish matches we found. Include the
                // Spanish word we found
                const spanish_icons = spanish_matches
                    .flatMap(spanish => spanishMap[spanish].map(
                        icon => ({icon, found: spanish})
                    ));
                // Get any icons that match directly
                const direct_matches = this.allIcons
                    .filter(icon => matcher.test(icon));
                // Put them in the same format as the Spanish icon objects we
                // build above
                const direct_icons = direct_matches
                    .map(icon => ({icon, found: icon}));

                // Combine the direct matches and Spanish matches, along with
                // the term we used to find them.
                return {
                    term,
                    icons: spanish_icons.concat(direct_icons),
                };
            });

            // We have some lists of which icons match which search terms
            // (including which Spanish word made that match). Now let's make
            // an object with the icons as the keys, and the term info as part
            // of the value.
            //
            // We mostly need to count how many terms led to each icon. Icons
            // that matched more terms are better matches.
            //
            // Wind up with this:
            // {
            //  icon: {
            //      terms: [string],
            //      matches: [
            //          {term: string, found: string},
            //      ]
            //  }
            // }
            const iconMatches = matches
                .reduce((all, {icons, term}) => {
                    icons.forEach(({icon, found}) => {
                        if (! all[icon]) {
                            all[icon] = {terms: [], matches: []};
                        }
                        all[icon].terms = [...new Set(all[icon].terms.concat(term))];
                        all[icon].matches.push({term, found});
                    });
                    return all;
                }, {});

            return {
                // All the icons sorted by how many times they matched
                // [string]
                icons: Object.keys(iconMatches)
                    .sort((a, b) => {
                        const diff = iconMatches[b].terms.length
                            - iconMatches[a].terms.length;
                        if (diff) {
                            return diff;
                        } else {
                            return a.localeCompare(b);
                        }
                    }),
                // All the information we collected about the icons, for
                // debugging
                matches: iconMatches,
            };
        },
        /**
         * We want words with accents to match words without them, and vice
         * versa. And the same with other letters which are commonly
         * interchanged. Also, anything that isn't a letter or number should
         * just match whateverly or even nothingly.
         *
         * @param  string term
         * @return RegExp
         */
        makeRegExp(term) {
            return new RegExp(
                term
                    // Not a letter? Match whatever. Or nothing.
                    .replace(/[^0-9a-zàáâäæãåāèéêëēėęîïíīįìôöòóœøōõûüùúūñçčğ%ºªþșł]/i, '.?')
                    // A, E, I, O, U, are interchangeable with other versions
                    .replace(/[aàáâäæãåāª]/i, '[aàáâäæãåāª]')
                    .replace(/[eèéêëēėę]/i, '[eèéêëēėę]')
                    .replace(/[iîïíīįì]/i, '[iîïíīįì]')
                    .replace(/[oôöòóœøōõº]/i, '[oôöòóœøōõº]')
                    .replace(/[uûüùúū]/i, '[uûüùúū]')
                    // n and ñ are interchangeable
                    .replace(/[nñ]/i, '[nñ]'),
                'i'
            );
        }
    },
};
</script>
