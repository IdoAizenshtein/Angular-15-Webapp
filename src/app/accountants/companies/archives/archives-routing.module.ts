import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {AuthGuard} from '@app/login/auth-guard.service';
import {ArchivesComponent} from '@app/accountants/companies/archives/archives.component';

const archivesRouting: Routes = [
    {
        path: '',
        component: ArchivesComponent,
        canActivate: [AuthGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(archivesRouting)],
    exports: [RouterModule]
})
export class ArchivesRoutingModule {
}
