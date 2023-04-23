# Obsidian Handlebars Template Plugin

This is a plugin for [Obsidian](https://obsidian.md) adding support for the [Handlebars](https://handlebarsjs.com/) template engine in Obsidian notes. It also provides a [Block Helper](https://handlebarsjs.com/guide/block-helpers.html), ['notes'](#notes), that allows iterating through notes in the vault and generating Markdown.

Because this is a very simple *(yet powerful)* plugin, it is very small and does support mobile.

## Basic Example

Generate Markdown using the variables defined in the YAML frontmatter:

`````md
---
tags:
  - cool
  - awesome
---

```handlebars
tags: {{#each frontmatter.tags}}{{.}}, {{/each}}
```
`````

Generating:

```
tags: cool, awesome, 
```
 
Each block runs independently through compilation and rendering. That means that if you define a partial in one block, it won't be useable in another. The context that is provided to each block has the ```NoteMetadata``` interface defined in [main.ts](/main.ts). 

```ts
interface NoteMetadata {
  'basename': string,
  'name': string,
  'path': string, 
  'extension': string,
  'frontmatter'?: Record<string, any>
}
```

## notes

Use the provided notes helper to request notes by path. If the request path is a directory, the all the contained files will be returned (not recursive). The context for each returned file item has the NoteMetadata interface and supports ```@index``` as well.

To generate a list of links to all notes in the 'Ideas' folder:
`````md
```handlebars
{{#notes 'Ideas'}}  - {{@index}} [{{name}}]({{path}})
{{/notes}}
```
`````
## link partial

Use the link partial to generate internal links to notes or files in the vault.
`````md
```handlebars
{{#notes 'Ideas'}}  - {{>link path}}
{{/notes}}
```
`````

The link partial either takes a path to a file as a parameter or takes dictionary parameters to further customize the link. 
- ```path```: the path to link to
- ```rel```: the path to the note that will render the link to make it relative instead of absolute
- ```alias```: alternate name to use for the ink
- ```hash```: a #hash to use for the link, for deep linking to an anchor in a note

`````md
```handlebars
{{#notes 'Ideas'}}  - {{>link path=path rel=../path alias=@index}}
{{/notes}}
```
`````
## Missing Features

> Does it have settings allowing you to define you're own handlerbar partials or helpers?

No

> Does it have error indicators when there's a syntax error?

Also no

> Ok what about... 

Probably not, it's really simple plugin: one direct dependency and less than 100 lines. It's currently very easy to customize manually, which brings me too...

## Contributing

I'm more than happy to review any changes. When deciding to fork or PR, keep in mind that I value:
- supporting mobile (no Node.js packages, only pure JS dependencies)
- being small (no large dependencies, eg React.js)
- being simple
