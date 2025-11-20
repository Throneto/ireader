namespace Ireadervalar.Images;

using System.IO.Abstractions;
using Ireadervalar.Content;

public interface IImageAnalysisProvider
{
    string ImageAnalysisFileExtension { get; }

    Task<IReadOnlyCollection<Chunk>> ReadTextChunksAsync(IFileInfo imageAnalysisFile);
}
