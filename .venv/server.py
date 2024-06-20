import os
import json
from collections import defaultdict
from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.feature_extraction.text import CountVectorizer, TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from nltk.stem import PorterStemmer
import re
import numpy as np

app = Flask(__name__)  # guardar servidor en app
CORS(app)  # permitir solicitudes CORS de cualquier origen

api = '/api/v1/'  # nombre de la api

# Leer documentos y nombres de archivos
def read_preprocessed_files(folder):
    documents = []
    filenames = []

    for filename in os.listdir(folder):
        if '.' not in filename:
            with open(os.path.join(folder, filename), 'r', encoding='latin1') as file:
                content = file.read()
                documents.append(content)
                filenames.append(filename)
    return documents, filenames

documents, filenames = read_preprocessed_files('data/reuters/preprocessed_data')


# Aplicar TF-IDF
def apply_tfidf(documents):
    vectorizer = TfidfVectorizer()
    X = vectorizer.fit_transform(documents)
    return X, vectorizer

X_tfidf, tfidf_vectorizer = apply_tfidf(documents)

# Construir índice invertido
def build_inverted_index(X, vectorizer, filenames):
    inverted_index = defaultdict(list)
    terms = vectorizer.get_feature_names_out()
    for doc_id, doc in enumerate(X.toarray()):
        for term_id, term_freq in enumerate(doc):
            if term_freq > 0:
                term = terms[term_id]
                inverted_index[term].append(filenames[doc_id])
    return inverted_index

inverted_index_tfidf = build_inverted_index(X_tfidf, tfidf_vectorizer, filenames)

# Preprocesamiento de consulta
stop_words = set(stopwords.words('english'))
ps = PorterStemmer()

def preprocess_query(text):
    text = re.sub(r'\s+', ' ', text)  # remover espacios extra
    text = re.sub(r'[^a-zA-Z]', ' ', text)  # mantener solo caracteres alfabéticos
    text = text.lower()  # convertir a minúsculas

    tokens_query = word_tokenize(text, language='english')  # tokenización

    tokens_query = [ps.stem(word) for word in tokens_query if
                    word not in stop_words and len(word) > 1]  # eliminar stop words y aplicar stemming

    return ' '.join(tokens_query)

# Calcular similitud coseno
def calculate_cosine_similarity(query_vector, X):
    similarities = cosine_similarity(query_vector, X)  # calcular similitudes usando similitud coseno
    return similarities.flatten()

# Búsqueda
def search(query, inverted_index, vectorizer, X, filenames, top_n=None):
    query = preprocess_query(query)
    query_terms = query.split()

    filename_to_index = {filename: idx for idx, filename in enumerate(filenames)}  # mapear nombres de archivos a sus índices
    relevant_docs = set()
    for term in query_terms:
        if term in inverted_index:
            relevant_docs.update(inverted_index[term])
    relevant_docs = [filename_to_index[doc] for doc in relevant_docs if doc in filename_to_index]  # convertir nombres de archivos relevantes a índices
    if not relevant_docs:
        return [], []
    X_relevant = X[relevant_docs]
    filenames_relevant = [filenames[i] for i in relevant_docs]

    # procesar la consulta y calcular similitudes
    query_vector = vectorizer.transform([query])
    similarities = cosine_similarity(query_vector, X_relevant).flatten()

    # ordenar documentos por similitud y limitar a los que tengan una similitud mayor al 35%
    ranked_indices = np.argsort(similarities)[::-1][:top_n]
    ranked_filenames = [filenames_relevant[i] for i in ranked_indices if similarities[i] > 0.35]

    return ranked_filenames, similarities[ranked_indices]

# flask routing
@app.route(api + 'search', methods=['POST'])
def buscar():
    data = request.get_json()
    query = data.get('query')
    ranked_filenames_tfidf, similarities_tfidf = search(query, inverted_index_tfidf, tfidf_vectorizer, X_tfidf, filenames)
    results = {'results': ranked_filenames_tfidf}
    return jsonify(results)

# servidor principal
if __name__ == '__main__':
    app.run(debug=True)  # si se realizan cambios se actualiza automáticamente
