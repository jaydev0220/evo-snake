import { createPinia } from 'pinia';
import { createApp } from 'vue';

import App from './App.vue';
import { i18n } from './lib/i18n';
import { setupSeo } from './lib/seo';

import './styles.css';

setupSeo();

const app = createApp(App);

app.use(createPinia());
app.use(i18n);

app.mount('#app');
