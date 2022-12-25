import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
    name: 'verticesArrayToPolygonPoints'
})
export class VerticesArrayToPolygonPointsPipe implements PipeTransform {
    transform(value: Array<{ x: number; y: number }>, args?: any): string {
        return Array.isArray(value) && value.length
            ? value
                .map(
                    (vertx) =>
                        (vertx.x !== undefined ? vertx.x : 0) +
                        ' ' +
                        (vertx.y !== undefined ? vertx.y : 0)
                )
                .join(' ')
            : null;
    }
}
