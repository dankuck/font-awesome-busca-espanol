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
                v-for="icon in icons"
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
                </a>
            </div>
            <div v-if="icons.length === 0" class="col text-center fs-1">
                No hay resultados.
            </div>
        </div>
    </div>
</template>

<script>
import spanishMap from '../spanish_map/spanish_map.json';
window.spanishMap = spanishMap;
export default {
    data() {
        return {
            query: '',
        };
    },
    computed: {
        icons() {
            if (! this.query) {
                return this.allIcons;
            } else {
                return this.search(this.query);
            }
        },
        allIcons() {
            return [...new Set(Object.values(spanishMap).flat(1))];
        },
    },
    methods: {
        search(query) {
            // We'll search for each word separately
            const queryWords = query.toLowerCase().split(/\s+/);
            const matchers = queryWords.map(
                query => new RegExp(query)
            );

            // Get any Spanish words that have any matches
            const spanish = Object.keys(spanishMap)
                .filter(word => matchers.some(matcher => matcher.test(word)));
            // Search the original English icon names too
            const english = this.allIcons
                .filter(word => matchers.some(matcher => matcher.test(word)));

            // The Spanish ones still need to be mapped to icon names, but the
            // English ones are already icon names
            const icons = spanish.flatMap(word => spanishMap[word])
                .concat(english)

            // Now we'll count how many of each icon is in this set. It could
            // be many because different word could have hit on the same icon
            const iconFrequency = icons
                .reduce((all, icon) => {
                    all[icon] = (all[icon] || 0) + 1;
                    return all;
                }, {});

            // Let's get all the icons sorted by how many times they matched
            return Object.keys(iconFrequency)
                .sort((a, b) => iconFrequency[b] - iconFrequency[a]);
        },
    },
};
</script>
