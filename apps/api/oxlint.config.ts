import oxlintConfig from '@packages/configs/.oxlintrc.json' with { type: 'json' };
import { defineConfig } from 'oxlint';

export default defineConfig({
	...oxlintConfig
});
