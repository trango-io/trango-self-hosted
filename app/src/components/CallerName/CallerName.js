import React, { Component } from 'react'
import './CallerName.css'
import Avatar from '@material-ui/core/Avatar';
class CallerName extends Component{
    render(){
        return(
            <div className='caller-name d-inline-block p-3'>
                <div className='row'>
                    <div className='col-3'>
                    <div className='d-inline'><Avatar>N</Avatar></div>
                    </div>
                    <div className='col-9'>
                    <div className=' d-inline name'>wasif ali</div>
                    </div>
                </div>
            </div>
)
        
}
}
export default CallerName