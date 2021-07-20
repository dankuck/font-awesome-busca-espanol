/**
 * Got arrays that are too big to render? Render them slowly with
 * ArrayGovernorMixin.
 *
 * Usage:
 *
 * // YourComponent.vue
 * export default {
 *     mixins: [
 *         ArrayGovernorMixin('bigHonkinArray', 100, 10, 20),
 *     ],
 *     data: {
 *         bigHonkinArray: [...],
 *     },
 * };
 *
 * And then you're ready.
 *
 * The mixin provides a new variable `bigHonkinArrayGovernor` to use instead of
 * `bigHonkinArray`. In this example, every time the original array changes,
 * the new one will start at 20 length, then it will grow by 100 elements every
 * 10 ms.
 *
 * The idea here is that rendering 1000's of elements may slow down your
 * browser for too long. By using a governed array, you can render 100 at a
 * time. Vue will be smart enough to reuse the ones that are already rendered
 * each time the array grows (especially if you use :key in your v-fors like
 * Vue insists that you should).
 *
 * By rendering only a few at a time, we allow the browser to attend to other
 * matters, such as user input.
 *
 * @param  string key    The name of the original array
 * @param  int increment How many to add every `freq` ms
 * @param  int freq      How often to add elements from the original array
 * @param  int start     How many to start with if you don't want to start with
 *                       the same number as `increment`
 * @return Mixin
 */
export default function arrayGovernor(key, increment, freq, start = null) {
    if (start === null) {
        start = increment;
    }
    const gov = key + 'Governor';
    const index = key + 'GovernorIndex';
    const interval = key + 'GovernorInterval';

    const watch = {};
    watch[key] = function () {
        const length = this[key].length;
        if (this[interval]) {
            clearInterval(this[interval]);
        }
        this[index] = start;
        this[interval] = setInterval(
            () => {
                this[index] += increment;
                if (this[index] > length) {
                    clearInterval(this[interval]);
                    this[interval] = null;
                }
            },
            freq
        );
    };

    const computed = {};
    computed[gov] = function () {
        return this[key].slice(0, this[index]);
    };

    return {
        data() {
            const data = {};
            data[index] = Number.MAX_SAFE_INTEGER;
            data[interval] = null;
            return data;
        },
        watch,
        computed,
    };
};
