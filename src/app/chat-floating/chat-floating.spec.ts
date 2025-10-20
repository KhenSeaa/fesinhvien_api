import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatFloating } from './chat-floating';

describe('ChatFloating', () => {
  let component: ChatFloating;
  let fixture: ComponentFixture<ChatFloating>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatFloating]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChatFloating);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
