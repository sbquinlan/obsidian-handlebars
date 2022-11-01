
import * as Handlebars from 'handlebars';
import { CachedMetadata, debounce, MarkdownPostProcessorContext, MarkdownRenderer, normalizePath, Plugin, TFile, TFolder } from 'obsidian';

type NoteMetadata = Pick<TFile, 'basename' | 'name' | 'path' | 'extension'> 
	& Pick<CachedMetadata, 'frontmatter'>;

export default class MyPlugin extends Plugin {

	async onload() {
		const self_app = this.app;
		function note_record(file: TFile): NoteMetadata {
			const { basename, name, path, extension } = file;
			const { frontmatter } = self_app.metadataCache.getFileCache(file) ?? {};
			return { basename, name, path, extension, frontmatter };
		}

		interface LinkOptions {
			path: string;
			rel?: string;
			hash?: string;
			alias?: string;
		}
		function link_options(path_or_hash: string | Record<number | string, string>): LinkOptions {
			if (!path_or_hash) return { path: '' };
			if (typeof path_or_hash === 'string') {
				return { path: normalizePath(path_or_hash) }
			}
			const { path = '', rel, hash, alias } = path_or_hash;
			return { 
				path: normalizePath(path), 
				rel, 
				hash,
				alias: alias !== undefined ? String(alias) : undefined,
			};
		}

		Handlebars.registerPartial('link', (path_or_hash, _options) => {
			const { path, rel, hash, alias } = link_options(path_or_hash);
			const file = self_app.vault.getAbstractFileByPath(path)
			if (!(file instanceof TFile)) return '';
			return self_app.fileManager.generateMarkdownLink(
				file, 
				rel ? normalizePath(rel) : self_app.vault.getRoot().path, 
				hash, 
				alias
			);
		})

		Handlebars.registerHelper('notes', (unsafe_path, options) => {
			if (!unsafe_path || typeof unsafe_path !== 'string') return [];
			const result = self_app.vault.getAbstractFileByPath(normalizePath(unsafe_path))
			if (!result) return [];
			const files = result instanceof TFolder 
				? result.children
				: [result];
			return files.filter((f): f is TFile => f instanceof TFile)
				.map((f, index) => options.fn(note_record(f), { data: { ... options.data ?? {}, index }}))
				.join('');
		})

		const block_handler = debounce(
			async (source: string, container: HTMLElement, { sourcePath: path }: MarkdownPostProcessorContext) => {
				const file = self_app.vault.getAbstractFileByPath(path);
				try {
					const template = Handlebars.compile(source, { noEscape: true, strict: true });
					await MarkdownRenderer.renderMarkdown(
						template(note_record(file as TFile)),
						container,
						path,
						// @ts-ignore: docs say this is optional
						undefined,
					);
				} catch (e) {
					console.warn(e);
				}
			},
			250,
		)

		this.registerMarkdownCodeBlockProcessor(
			'handlebars',
			async (source, el, ctx) => block_handler(source, el, ctx)
		)
	}
}