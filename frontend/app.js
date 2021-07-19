import Vue from 'vue';
import App from './App.vue';

new Vue({
    components: {
        App,
    },
    el: '#app',
    methods: {
        search(query) {
            alert(query);
        },
    },
});
