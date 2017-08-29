<?php
set_exception_handler('exception_handler');

function exception_handler($e)
{
    echo $e;
	//echo $e->getFile().':'.$e->getLine().'  ' . $e->getMessage();
}
?>