import { NgModule } from '@angular/core';
import { RecipesComponent } from './recipes.component';
import { RecipeListComponent } from './recipe-list/recipe-list.component';
import { RecipeDetailComponent } from './recipe-detail/recipe-detail.component';
import { RecipeEditComponent } from './recipe-edit/recipe-edit.component';
import { RecipeItemComponent } from './recipe-list/recipe-item/recipe-item.component';
import { RecipeStartComponent } from './recipe-start/recipe-start.component';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { RecipeRoutingModule } from './recipe-routing.module';
import { SharedModule } from '../shared/shared.module';

@NgModule({
 declarations: [
    RecipesComponent,
    RecipeListComponent,
    RecipeDetailComponent,
    RecipeItemComponent,
    RecipeStartComponent,
    RecipeEditComponent
 ],
 imports: [RouterModule, SharedModule, ReactiveFormsModule, RecipeRoutingModule],
//  exports: [
//     RecipesComponent,
//     RecipeListComponent,
//     RecipeDetailComponent,
//     RecipeItemComponent,
//     RecipeStartComponent,
//     RecipeEditComponent
//  ]                           // Dont required here because we already handling this recipe-routing file
})
export class RecipesModule {}
