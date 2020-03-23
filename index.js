const actions = [];
let actionId = 0;
const pascalCase = (input) => `${input[0].toUpperCase()}${_.camelCase(input).substring(1)}`
const addAction = () => {
    const action = document.createElement("div");
    action.innerHTML = `
        <hr>
        <div>
            <label>Action Name</label>
            <input id="name" type="text" value="">
        </div>
        <div>
            <label>Action Description</label>
            <input id="description" type="text" value="">
        </div>
        <div>
            <label>Inherit feature name</label>
            <input id="inheritFeatureName" type="checkbox" checked="true" value="">
        </div>
        <button class="buttonRemove buttonSecondary" onclick="removeAction(${actionId})">Remove Action</button>
    `;
    action.setAttribute("actionId", actionId);
    document.getElementById("actions").appendChild(action);
    actions.push(action);
    actionId++;
};

const removeAction = (id) => {
    const index = actions.findIndex(action => action.getAttribute("actionId") === `${id}`);
    document.getElementById("actions").removeChild(actions[index]);
    actions.splice(index, 1);
};

const inheritedName = (name, featureName, inheritFeatureName) => `${name}${inheritFeatureName ? featureName : ''}`;

const setActionsData = () => {
    const featureNameRaw = document.getElementById("featureName").value;
    if (!featureNameRaw) {
        return [];
    }
    const featureName = pascalCase(featureNameRaw);
    const featureNameFirstLower = `${featureName[0].toLowerCase()}${featureName.substring(1)}`
    return actions.map(action => {
        const name = _.camelCase(action.querySelector("#name").value);
        const description = action.querySelector("#description").value;
        const inheritFeatureName = action.querySelector("#inheritFeatureName").checked;
        if (!name || !description) {
            return;
        }
        const actionName = inheritedName(`${name[0].toUpperCase()}${name.substring(1)}`, featureName, inheritFeatureName)
        return { featureName, featureNameFirstLower, name, actionName, description, inheritFeatureName };
    }).filter(action => action);
}

const generateActionEnum = ({ featureName, featureNameFirstLower, name, actionName, description, inheritFeatureName }) => {
    // Enum naming convention
    return `${actionName} = '[${featureName} component] ${description}',
            ${actionName}Success = '[${featureName} component] ${description} Success'`;
}

const generateAction = ({ featureName, featureNameFirstLower, name, actionName, description, inheritFeatureName }) => {
    // Enum naming convention
    return `export const ${inheritedName(name, featureName, inheritFeatureName)}Action = createAction(${featureName}Actions.${actionName}, props<{}>());
    export const ${inheritedName(name, featureName, inheritFeatureName)}SuccessAction = createAction(${featureName}Actions.${actionName}Success, props<{}>());`;
}

const generateActionImports = ({ featureName, featureNameFirstLower, name, actionName, description, inheritFeatureName }) => `${inheritedName(name, featureName, inheritFeatureName)}Action, ${inheritedName(name, featureName, inheritFeatureName)}SuccessAction`;

const generateEffect = ({ featureName, featureNameFirstLower, name, actionName, description, inheritFeatureName }) => {
    return `
        ${inheritedName(name, featureName, inheritFeatureName)}$ = createEffect(() =>
            this.actions$.pipe(
            ofType(${inheritedName(name, featureName, inheritFeatureName)}Action),
            switchMap((action: any) =>
                this.${featureNameFirstLower}Service.${inheritedName(name, featureName, inheritFeatureName)}().pipe(
                map(() => ${inheritedName(name, featureName, inheritFeatureName)}SuccessAction({})),
                catchError(() => EMPTY)
                )
            )
            )
        );
    `
};

const generateService = ({ featureName, featureNameFirstLower, name, actionName, description, inheritFeatureName }) => {
    return `${inheritedName(name, featureName, inheritFeatureName)}(): Observable<any> {
                return null;
            }`;
}

const generateReducer = ({ featureName, featureNameFirstLower, name, actionName, description, inheritFeatureName }) => {
    return `on(${inheritedName(name, featureName, inheritFeatureName)}Action, state => ({ ...state })),
    on(${inheritedName(name, featureName, inheritFeatureName)}SuccessAction, state => ({ ...state }))
    `;
};

const generate = (event) => {
    const actionsData = setActionsData();

    document.getElementById("results").style.display = "hidden";
    if (actionsData.length === 0) {
        return;
    }
    document.getElementById("results").style.display = "block";
    const featureName = pascalCase(document.getElementById("featureName").value);
    const featureNameFirstLower = `${featureName[0].toLowerCase()}${featureName.substring(1)}`

    // Set actions
    document.getElementById("action").innerText = js_beautify(`
        import { createAction, props } from '@ngrx/store';
        export enum ${featureName}Actions {
        ${actionsData.map(generateActionEnum).join(',')}
        }
    ${actionsData.map(generateAction).join('')}`);

    // Set effects
    document.getElementById("effect").innerText = js_beautify(`
        import { Injectable } from '@angular/core';
        import { createEffect, ofType, Actions } from '@ngrx/effects';
        import { switchMap, map, catchError } from 'rxjs/operators';
        import { EMPTY } from 'rxjs';
        import { ${actionsData.map(generateActionImports).join(',')} } from '../actions/${_.kebabCase(featureName)}.action';
        @Injectable()
        export class ${featureName}Effect {
            ${actionsData.map(generateEffect).join('')}
        constructor(private actions$: Actions, private ${featureNameFirstLower}Service: ${featureName}Service) {}
        }
    `);

    // Set services
    document.getElementById('service').innerText = js_beautify(`
        import { Injectable } from '@angular/core';
        import { Observable } from 'rxjs';
        import { HttpClient } from '@angular/common/http';
        @Injectable({
            providedIn: 'root'
        })
        export class ${featureName}Service {
            constructor(private http: HttpClient) {}
            ${actionsData.map(generateService).join('')}
        }`);

    // Set reducers
    document.getElementById('reducer').innerText = js_beautify(`
      import { createReducer, on, Action } from '@ngrx/store';
      import { ${actionsData.map(generateActionImports).join(',')} } from '../actions/${_.kebabCase(featureName)}.action';
      import { I${featureName}State, Initial${featureName}State } from '../states/${_.kebabCase(featureName)}.state';
      const ${featureNameFirstLower}Reducers = createReducer(
        Initial${featureName}State,
        ${actionsData.map(generateReducer).join(',')}
      );
      
      export function ${featureName}Reducer(state: I${featureName}State, action: Action) {
        return ${featureNameFirstLower}Reducers(state, action);
      }
    `);

    // Set state
    document.getElementById('state').innerText = js_beautify(`
        export interface I${featureName}State {}
        export const Initial${featureName}State: I${featureName}State = {};
    `);

    // Set header file names
    const fileName = (type) => `${_.kebabCase(featureName)}.${type}.ts`;
    document.getElementById("actionFileName").innerText = fileName("action");
    document.getElementById("effectFileName").innerText = fileName("effect");
    document.getElementById("serviceFileName").innerText = fileName("service");
    document.getElementById("reducerFileName").innerText = fileName("reducer");
    document.getElementById("stateFileName").innerText = fileName("state");
    // Apply syntax highlighting
    document.querySelectorAll('pre code').forEach((block) => hljs.highlightBlock(block));
};
