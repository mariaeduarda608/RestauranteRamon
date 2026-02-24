<?php

namespace App\Http\Controllers;

use App\Models\Prato;
use Illuminate\Http\Request;

class PratoController extends Controller
{
    public function index()
    {
        return response()->json(Prato::all());
    }

    public function store(Request $request)
    {
        $prato = Prato::create($request->all());
        return response()->json($prato, 201);
    }

    public function show(string $id)
    {
        return response()->json(Prato::findOrFail($id));
    }

    public function update(Request $request, string $id)
    {
        $prato = Prato::findOrFail($id);
        $prato->update($request->all());
        return response()->json($prato);
    }

    public function destroy(string $id)
    {
        $prato = Prato::findOrFail($id);
        $prato->delete();

        return response()->json([
            'message' => 'Prato removido com sucesso'
        ]);
    }
}