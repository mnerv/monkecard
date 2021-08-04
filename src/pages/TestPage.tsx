import React from 'react'
import { ChevronRight } from '@assets/icons'

import {
  ListComponent,
  ListItemText,
  ListItemButton,
  ListItemInputText,
  ListItemMark,
  ListItemInputSwitch
} from '@components/List'
import { Palette2 } from '@assets/icons'

import './test-page.scss'

export const TestPage: React.FC = (props) => {
  return (
    <div className="test__page">
      <div className="content">
        <ListComponent header="Test list">
          <ListItemInputText placeholder="hmmm" />
          <ListItemText text="Hello World!"/>
          <ListItemButton hideIcon={false} text="Hello There" />
          <ListItemButton
            icon={Palette2}
            text="Hello Thef"
            hideRightIcon={true}
            preview="well hello there"
            rightIcon={ChevronRight} />
          <ListItemInputText default="Test" />
          <ListItemMark
            text="Mark me"
            isMarked={false} onMark={(mark) => {
              console.log(mark)
            }} />
          <ListItemInputSwitch
            text="edit"
            preview="wow"
            onConfirm={(value) => {
              console.log(value)
            }}
          />
        </ListComponent>
      </div>
    </div>
  )
}