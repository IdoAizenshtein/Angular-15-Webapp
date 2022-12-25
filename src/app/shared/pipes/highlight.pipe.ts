import {Pipe, PipeTransform, SecurityContext} from '@angular/core';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';

@Pipe({
    name: 'highlight',
    pure: true
})
export class HighlightPipe implements PipeTransform {
    constructor(public sanitizer: DomSanitizer) {
    }

    transform(text: string, search): SafeHtml {
        if (search && text) {
            let pattern = search.replace(
                /[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g,
                '\\$&'
            );
            pattern = pattern
                .split(' ')
                .filter((t) => {
                    return t.length > 0;
                })
                .join('|');
            const regex = new RegExp(pattern, 'gi');
            return this.sanitizer.sanitize(
                SecurityContext.HTML,
                text
                    .toString()
                    .replace(
                        regex,
                        (match) => `<span class="search-highlight">${match}</span>`
                    )
            );
        } else {
            return text;
        }
    }
}
