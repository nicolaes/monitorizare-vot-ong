import { LoadNotesAction } from '../note/note.actions';
import { shouldLoadPage } from '../../shared/pagination.service';
import { AnswerState } from './answer.reducer';
import { AppState } from '../store.module';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Rx';
import { ApiService } from '../../core/apiService/api.service';
import { CompletedAnswer } from '../../models/completed.answer.model';
import { CompletedQuestion } from '../../models/completed.question.model';
import {
    AnswerActions,
    AnswerActionTypes,
    LoadAnswerDetailsAction,
    LoadAnswerDetailsDoneAction,
    LoadAnswerDetailsErrorAction,
    LoadAnswerPreviewAction,
    LoadAnswerPreviewDoneAction,
    LoadAnswerPreviewErorrAction
} from './answer.actions';
import { Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';

@Injectable()
export class AnswerEffects {

    state: AnswerState
    constructor(private http: ApiService, private actions: Actions, store: Store<AppState>) {
        store.select(s => s.answer).subscribe(s => this.state = s)
    }

    @Effect()
    loadThreads = this.actions
        .ofType(AnswerActionTypes.LOAD_PREVIEW)
        .filter((a: LoadAnswerPreviewAction) => shouldLoadPage(a.payload.page, a.payload.pageSize, this.state.threads.length))
        .switchMap((action: LoadAnswerPreviewAction) => {
            return this.http.get('/api/v1/raspunsuri', {
                body: {
                    page: action.payload.page,
                    pageSize: action.payload.pageSize,
                    urgent: action.payload.urgent
                }
            })
                .map(res => res.json())
                .map(json => new LoadAnswerPreviewDoneAction(json.data, json.totalItems, json.totalPages))
                .catch((err, caught) => Observable.of(new LoadAnswerPreviewErorrAction()));
        })

    shouldLoad(page: number, pageSize: number, arrayLen) {
        if(page === undefined || pageSize === undefined){
            return true;
        }

        return page * pageSize > arrayLen;
    }

    @Effect()
    loadDetails = this.actions
        .ofType(AnswerActionTypes.LOAD_DETAILS)
        .switchMap((action: LoadAnswerDetailsAction) => {
            return this.http.get('/api/v1/raspunsuri/RaspunsuriCompletate', {
                body: {
                    idSectieDeVotare: action.payload.sectionId,
                    idObservator: action.payload.observerId
                }
            }).map(res => <CompletedQuestion[]>res.json())
        })
        .map((answers: CompletedQuestion[]) => new LoadAnswerDetailsDoneAction(answers))
        .catch((err, caught) => Observable.from([new LoadAnswerDetailsErrorAction()]))

    @Effect()
    loadNotes = this.actions
        .ofType(AnswerActionTypes.LOAD_DETAILS)
        .map((a:LoadAnswerDetailsAction) => new LoadNotesAction(a.payload.sectionId,a.payload.observerId))

}