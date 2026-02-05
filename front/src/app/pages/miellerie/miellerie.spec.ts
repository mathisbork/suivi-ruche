import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Miellerie } from './miellerie';

describe('Miellerie', () => {
  let component: Miellerie;
  let fixture: ComponentFixture<Miellerie>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Miellerie]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Miellerie);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
