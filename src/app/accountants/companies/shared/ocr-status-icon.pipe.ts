import {Pipe, PipeTransform} from '@angular/core';
import {FileStatus} from './file-status.model';

@Pipe({
    name: 'ocrStatusIcon'
})
export class OcrStatusIconPipe implements PipeTransform {
    transform(value: FileStatus | string, args?: any): string {
        switch (value) {
            case FileStatus.WAIT_FOR_CONFIRM:
            case FileStatus[FileStatus.WAIT_FOR_CONFIRM]:
                return '/assets/images/visibility-button.svg';
            case FileStatus.CREATE_HASH_BANK:
                return '/assets/images/folder.svg';
            case FileStatus.ARCHIVE:
                return '/assets/images/box8.svg';
            case FileStatus.WAIT_FOR_CARE:
                return '/assets/images/flag.svg';
            default:
                return '';
        }
    }
}
