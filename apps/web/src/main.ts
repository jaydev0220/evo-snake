import { createPinia } from 'pinia';
import { createApp } from 'vue';

import App from './App.vue';
import { applyDefaultSeo } from './lib/seo';

import './styles.css';

applyDefaultSeo();

const app = createApp(App);

app.use(createPinia());

app.mount('#app');
