<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Prato extends Model
{
    protected $fillable = [
        'nome',
        'descricao',
        'preco',
        'categoria'
    ];
}
