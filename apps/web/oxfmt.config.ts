import oxfmtConfig from '@packages/configs/.oxfmtrc.json' with { type: 'json' };
import { defineConfig } from 'oxfmt';

export default defineConfig({
	...oxfmtConfig
});
