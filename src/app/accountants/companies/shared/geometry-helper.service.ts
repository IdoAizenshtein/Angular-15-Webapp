import {Injectable, NgModule} from '@angular/core';
import {AccountantsModule} from '../../accountants.module';
import intersect from '@turf/intersect';
import booleanContains from '@turf/boolean-contains';
import area from '@turf/area';
import {Point, Polygon} from '@turf/helpers';

// @NgModule({
//     providers: [
//         AccountantsModule
//     ]
// })
// @Injectable()

@Injectable({
    providedIn: AccountantsModule // 'root'
})
export class GeometryHelperService {
    constructor() {
    }

    minX(pnts: Array<{ x: number; y: number }>) {
        return Math.min(...pnts.map((pnt) => pnt.x));
    }

    maxX(pnts: Array<{ x: number; y: number }>) {
        return Math.max(...pnts.map((pnt) => pnt.x));
    }

    // sortByDistanceFrom0(pnts: Array<{ x: number, y: number }>): Array<{ x: number, y: number }> {
    //     return pnts.concat().sort((a, b) => this.distanceFrom0(a) - this.distanceFrom0(b));
    // }

    minY(pnts: Array<{ x: number; y: number }>) {
        return Math.min(...pnts.map((pnt) => pnt.y));
    }

    maxY(pnts: Array<{ x: number; y: number }>) {
        return Math.max(...pnts.map((pnt) => pnt.y));
    }

    sortByDistanceFrom0MinMaxOnly(
        pnts: Array<{ x: number; y: number }>
    ): Array<{ x: number; y: number }> {
        const pntsSorted = pnts
            .concat()
            .sort((a, b) => this.distanceFrom0(a) - this.distanceFrom0(b));
        return [pntsSorted[0], pntsSorted[pntsSorted.length - 1]];
    }

    findClosestByOrdinateIn(
        pnts: Array<{ x: number; y: number }>,
        sourcePointIdx: number,
        axis: 'x' | 'y'
    ): { x: number; y: number } {
        return pnts
            .filter((vert, idx) => idx !== sourcePointIdx)
            .sort(
                (a, b) =>
                    Math.abs(a[axis] - pnts[sourcePointIdx][axis]) -
                    Math.abs(b[axis] - pnts[sourcePointIdx][axis])
            )[0];
    }

    // verticesize(pnts: Array<{ x: number, y: number }>): Array<{ x: number, y: number }> {
    //     //   0 | 1
    //     //  ---+-->
    //     //   3 | 2
    //     const center = this.centerOf(pnts);
    //     const pntsSortedRelativeToCenter = pnts.concat().sort((a, b) => {
    //         if ((a.x < center.x === b.x < center.x) || (a.x > center.x ===  b.x > center.x)) {
    //             return a.y < b.y ? -1 : 1;
    //         } else if (a.x < center.x) {
    //             return -1;
    //         } else {
    //             return 1;
    //         }
    //     });
    //         // (b.x - center.x) * (b.y - center.y) - (a.x - center.x) * (a.y - center.y));
    //     console.log('%o ----> %o  --> %o', pnts, pntsSortedRelativeToCenter, center);
    //     return pntsSortedRelativeToCenter;
    // }

    rectanglesIntersect(
        container: Array<{ x: number; y: number }>,
        verticesB: Array<{ x: number; y: number }>
    ): boolean {
        const geoPolyContainer = this.asGeoPoly(container);
        const geoPolyB = this.asGeoPoly(verticesB);
        // const result = intersect(geoPolyContainer, geoPolyB);
        // if (result) {
        //     // debugger;
        // }
        return (
            booleanContains(geoPolyContainer, geoPolyB) ||
            booleanContains(geoPolyContainer, this.asGeoPoint(verticesB))
        );
        // const [minA, maxA] = this.sortByDistanceFrom0MinMaxOnly(verticesA);
        // const [minB, maxB] = this.sortByDistanceFrom0MinMaxOnly(verticesB);
        //
        // const aLeftOfB = maxA.x <= minB.x,
        //     aRightOfB = minA.x >= maxB.x,
        //     aAboveB = minA.y >= maxB.y, aBelowB = maxA.y <= minB.y;
        //
        // return !(aLeftOfB || aRightOfB || aAboveB || aBelowB);
    }

    rectangleContains(
        container: Array<{ x: number; y: number }>,
        vertices: Array<{ x: number; y: number }>
    ): boolean {
        const geoPolyContainer = this.asGeoPoly(container);
        const geoPoly = this.asGeoPoly(vertices);

        if (booleanContains(geoPolyContainer, geoPoly)) {
            return true;
        }

        const intersection =
            intersect(geoPolyContainer, geoPoly) ||
            intersect(geoPoly, geoPolyContainer);
        if (!intersection) {
            return false;
        }
        const geoPolyArea = area(geoPoly);
        const geoPolyIntersectionArea = area(intersection);
        return geoPolyArea * 0.5 <= geoPolyIntersectionArea;
    }

    centerOf(vertices: Array<{ x: number; y: number }>): {
        x: number;
        y: number;
    } {
        const xOrds = vertices.map((v) => v.x),
            yOrds = vertices.map((v) => v.y);
        return {
            x: (Math.min(...xOrds) + Math.max(...xOrds)) / 2,
            y: (Math.min(...yOrds) + Math.max(...yOrds)) / 2
        };
    }

    angleDeltaRadiansPoly(
        verticesA: Array<{ x: number; y: number }>,
        verticesB: Array<{ x: number; y: number }>
    ): number {
        const angle = this.angleRadiansPoly(verticesA, verticesB);
        return Math.min(Math.abs(angle), Math.abs(Math.abs(angle) - Math.PI));
    }

    angleRadiansPoly(
        verticesA: Array<{ x: number; y: number }>,
        verticesB: Array<{ x: number; y: number }>
    ): number {
        return this.angleRadians(
            this.centerOf(verticesA),
            this.centerOf(verticesB)
        );
    }

    angleRadians(
        a: { x: number; y: number },
        b: { x: number; y: number }
    ): number {
        return Math.atan2(b.y - a.y, b.x - a.x);
    }

    mergedBoxOf(
        words: Array<{ boundingBox: { vertices: Array<{ x: number; y: number }> } }>
    ): Array<{ x: number; y: number }> {
        return this.mergedBoxOfPoly(words.map((word) => word.boundingBox));
    }

    mergedBoxOfPoly(
        boundingBoxes: Array<{ vertices: Array<{ x: number; y: number }> }>
    ): Array<{ x: number; y: number }> {
        if (boundingBoxes.length === 1) {
            return boundingBoxes[0].vertices;
        }
        const boundingBoxesSorted = []
            .concat(...boundingBoxes)
            .sort(
                (a, b) =>
                    this.distanceFrom0(this.centerOf(a.vertices)) -
                    this.distanceFrom0(this.centerOf(b.vertices))
            );

        return [
            boundingBoxesSorted[0].vertices[0],
            boundingBoxesSorted[boundingBoxesSorted.length - 1].vertices[1],
            boundingBoxesSorted[boundingBoxesSorted.length - 1].vertices[2],
            boundingBoxesSorted[0].vertices[3]
        ];
    }

    areAlignedHorizontally(
        verticesA: Array<{ x: number; y: number }>,
        verticesB: Array<{ x: number; y: number }>
    ): boolean {
        return (
            Math.abs(this.maxY(verticesA) - this.maxY(verticesB)) < 2 ||
            this.angleDeltaRadiansPoly(verticesA, verticesB) < 0.02
        );
    }

    areLineNeighbours(
        verticesA: Array<{ x: number; y: number }>,
        verticesB: Array<{ x: number; y: number }>
    ): boolean {
        if (!this.areAlignedHorizontally(verticesA, verticesB)) {
            return false;
        }

        const arr = [verticesA, verticesB];
        arr.sort(
            (a, b) =>
                this.distanceFrom0(this.centerOf(a)) -
                this.distanceFrom0(this.centerOf(b))
        );
        const horizontalGapAllowed =
            Math.max(
                verticesA[3].y - verticesA[0].y,
                verticesB[3].y - verticesB[0].y
            ) * 0.85;
        return arr[1][0].x - arr[0][1].x < horizontalGapAllowed;
    }

    correctOrder(
        vertices: Array<{ x: number; y: number }>
    ): Array<{ x: number; y: number }> {
        return vertices.sort((a, b) => {
            if (a.x === b.x) {
                if (a.y < b.y) {
                    return -1;
                } else if (a.y > b.y) {
                    return 1;
                }
            } else if (a.y === b.y) {
                if (a.x < b.x) {
                    return -1;
                } else if (a.x > b.x) {
                    return 1;
                }
            }
            return 0;
        });
    }

    // noinspection JSMethodCanBeStatic
    private distanceFrom0(pnt: { x: number; y: number }): number {
        // return Math.sqrt(pnt.x * pnt.x + pnt.y * pnt.y);
        return this.distanceBetween(pnt, {x: 0, y: 0});
    }

    private distanceBetween(
        pnt1: { x: number; y: number },
        pnt2: { x: number; y: number }
    ): number {
        return Math.hypot(pnt1.x - pnt2.x, pnt1.y - pnt2.y);
    }

    private asGeoPoly(vertices: Array<{ x: number; y: number }>): Polygon {
        return {
            type: 'Polygon',
            coordinates: [
                [
                    ...vertices.map((vert) => [vert.x, vert.y]),
                    [vertices[0].x, vertices[0].y]
                ]
            ]
        } as Polygon;
    }

    private asGeoPoint(vertices: Array<{ x: number; y: number }>): Point {
        const center = this.centerOf(vertices);
        return {
            type: 'Point',
            coordinates: [center.x, center.y]
        } as Point;
    }
}
